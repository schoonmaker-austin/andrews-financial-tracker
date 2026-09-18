const assert = require("node:assert/strict");
const { createCloudSync, SESSION_KEY } = require("./cloud-sync.js");

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function json(data, status = 200) {
  return new Response(data === null ? "" : JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function fakeSupabase() {
  let remote = null;
  return {
    get remote() { return remote; },
    set remote(value) { remote = value; },
    async fetch(url, options = {}) {
      const path = new URL(url).pathname;
      if (path === "/auth/v1/token") return json({ access_token: "access", refresh_token: "refresh", expires_in: 3600, user: { id: "user-1", email: "andrew@example.com" } });
      if (path === "/auth/v1/signup") return json({ access_token: "access", refresh_token: "refresh", expires_in: 3600, user: { id: "user-1", email: "andrew@example.com" } });
      if (path === "/auth/v1/logout") return json(null);
      if (path === "/rest/v1/finance_plans" && options.method === "GET") return json(remote ? [remote] : []);
      if (path === "/rest/v1/finance_plans" && options.method === "DELETE") { remote = null; return json(null); }
      if (path === "/rest/v1/rpc/save_finance_plan") {
        const body = JSON.parse(options.body);
        const version = remote?.version || 0;
        if (body.p_expected_version !== version) return json({ message: "sync_conflict", code: "P0001" }, 409);
        remote = { payload: body.p_payload, version: version + 1, updated_at: new Date().toISOString() };
        return json(remote);
      }
      return json({ message: `Unhandled ${options.method || "GET"} ${path}` }, 500);
    }
  };
}

(async function run() {
  const storage = new MemoryStorage();
  const statuses = [];
  const backend = fakeSupabase();
  let online = true;
  let scheduled = null;
  let state = { updatedAt: "2026-09-18T10:00:00.000Z", settings: { onboardingComplete: true }, expenses: [] };
  let applied = null;
  const sync = createCloudSync({ supabaseUrl: "https://test.supabase.co", publishableKey: "publishable-key-long-enough-for-test" }, {
    fetch: backend.fetch,
    storage,
    isOnline: () => online,
    now: () => Date.parse("2026-09-18T12:00:00.000Z"),
    setTimeout: fn => { scheduled = fn; return 1; },
    clearTimeout: () => { scheduled = null; }
  });
  sync.bind({
    getState: () => state,
    applyRemote: payload => { applied = payload; state = payload; },
    hasLocalData: () => Boolean(state.settings?.onboardingComplete),
    onStatus: update => statuses.push(update.status)
  });

  await sync.signIn("andrew@example.com", "correct-password");
  assert.equal(sync.isSignedIn(), true);
  assert.equal(backend.remote.version, 1, "first sign-in should seed the cloud with the existing local plan");
  assert.ok(storage.getItem(SESSION_KEY), "session should persist for the next visit");

  state = { ...state, updatedAt: "2026-09-18T13:00:00.000Z", profile: { checking: "500" } };
  sync.queueSave();
  await sync.flush();
  assert.equal(backend.remote.payload.profile.checking, "500");

  backend.remote = {
    payload: { updatedAt: "2026-09-18T14:00:00.000Z", settings: { onboardingComplete: true }, profile: { checking: "650" } },
    version: backend.remote.version + 1,
    updated_at: "2026-09-18T14:00:01.000Z"
  };
  await sync.reconcile();
  assert.equal(applied.profile.checking, "650", "a newer device change should replace an older local snapshot");

  online = false;
  state = { ...state, updatedAt: "2026-09-18T15:00:00.000Z", profile: { checking: "700" } };
  sync.queueSave();
  assert.equal(statuses.at(-1), "offline", "offline edits should be clearly queued rather than reported as synced");
  online = true;
  await sync.reconcile();
  assert.equal(backend.remote.payload.profile.checking, "700", "queued local edits should upload after reconnecting");

  state = { ...state, updatedAt: "2026-09-18T17:00:00.000Z", profile: { checking: "725" } };
  backend.remote = {
    payload: { ...state, updatedAt: "2026-09-18T16:00:00.000Z", profile: { checking: "710" } },
    version: backend.remote.version + 1,
    updated_at: "2026-09-18T16:00:01.000Z"
  };
  sync.queueSave();
  await sync.flush();
  assert.equal(backend.remote.payload.profile.checking, "725", "a version conflict should preserve the genuinely newer snapshot");

  await sync.resetRemote({ settings: { onboardingComplete: false }, expenses: [], debts: [] });
  assert.equal(backend.remote.payload.settings.onboardingComplete, false, "reset should replace remote financial data with a blank synchronized plan");
  assert.equal(backend.remote.payload.profile, undefined, "reset should not retain entered balances in the synchronized plan");
  await sync.signOut();
  assert.equal(sync.isSignedIn(), false);
  assert.equal(storage.getItem(SESSION_KEY), null);

  const disabled = createCloudSync({}, { storage: new MemoryStorage() });
  assert.equal(disabled.isEnabled(), false, "blank cloud configuration should keep the local-only app functional");

  console.log("Cloud sync scenarios passed: sign-in, first upload, newer remote, offline recovery, conflict handling, deletion, and local-only fallback.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
