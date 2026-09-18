(function (root) {
  "use strict";

  const SESSION_KEY = "financial-reset-planner-cloud-session-v1";
  const SAVE_DELAY_MS = 900;

  function createCloudSync(config = {}, dependencies = {}) {
    const fetcher = dependencies.fetch || root.fetch?.bind(root);
    const storage = dependencies.storage || root.localStorage;
    const isOnline = dependencies.isOnline || (() => root.navigator?.onLine !== false);
    const setTimer = dependencies.setTimeout || root.setTimeout?.bind(root);
    const clearTimer = dependencies.clearTimeout || root.clearTimeout?.bind(root);
    const now = dependencies.now || (() => Date.now());
    const baseUrl = String(config.supabaseUrl || "").replace(/\/$/, "");
    const publishableKey = String(config.publishableKey || "");
    const enabled = /^https:\/\/.+\.supabase\.co$/i.test(baseUrl) && publishableKey.length > 20;

    let session = readSession();
    let remoteVersion = 0;
    let saveTimer = null;
    let flushing = false;
    let queued = false;
    let bindings = {
      getState: () => ({}),
      applyRemote: () => {},
      hasLocalData: () => false,
      onStatus: () => {},
      onAuth: () => {}
    };

    function bind(nextBindings = {}) {
      bindings = { ...bindings, ...nextBindings };
      emitAuth();
      emitStatus(enabled ? session ? "connecting" : "local" : "not-configured");
    }

    function readSession() {
      try {
        const parsed = JSON.parse(storage?.getItem(SESSION_KEY));
        return parsed?.access_token && parsed?.refresh_token ? parsed : null;
      } catch {
        return null;
      }
    }

    function writeSession(next) {
      session = next;
      if (!storage) return;
      if (next) storage.setItem(SESSION_KEY, JSON.stringify(next));
      else storage.removeItem(SESSION_KEY);
    }

    function emitStatus(status, detail = "") {
      bindings.onStatus({ status, detail, enabled, signedIn: Boolean(session) });
    }

    function emitAuth(extra = {}) {
      bindings.onAuth({ enabled, signedIn: Boolean(session), email: session?.user?.email || "", ...extra });
    }

    function headers(withAuth = false, extra = {}) {
      const result = { apikey: publishableKey, "Content-Type": "application/json", ...extra };
      if (withAuth && session?.access_token) result.Authorization = `Bearer ${session.access_token}`;
      return result;
    }

    async function parseResponse(response) {
      const text = await response.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      if (!response.ok) {
        const message = data?.msg || data?.message || data?.error_description || data?.error || `Request failed (${response.status})`;
        const error = new Error(message);
        error.status = response.status;
        error.code = data?.code || "";
        error.details = data;
        throw error;
      }
      return data;
    }

    async function refreshSession() {
      if (!enabled || !session?.refresh_token) throw new Error("Sign in again to continue syncing.");
      const response = await fetcher(`${baseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: headers(false),
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      const next = await parseResponse(response);
      writeSession({ ...next, expires_at: now() + Number(next.expires_in || 3600) * 1000 });
      emitAuth();
      return session;
    }

    async function authorizedFetch(path, options = {}, retry = true) {
      if (!session) throw new Error("Sign in to sync this plan.");
      if (session.expires_at && session.expires_at - now() < 60_000) await refreshSession();
      const response = await fetcher(`${baseUrl}${path}`, {
        ...options,
        headers: headers(true, options.headers || {})
      });
      if (response.status === 401 && retry) {
        await refreshSession();
        return authorizedFetch(path, options, false);
      }
      return response;
    }

    async function signIn(email, password) {
      if (!enabled) throw new Error("Cloud sync has not been connected yet.");
      emitStatus("connecting");
      const response = await fetcher(`${baseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: headers(false),
        body: JSON.stringify({ email: String(email).trim(), password })
      });
      const data = await parseResponse(response);
      writeSession({ ...data, expires_at: now() + Number(data.expires_in || 3600) * 1000 });
      emitAuth();
      await reconcile();
      return { needsConfirmation: false, email: session.user?.email || email };
    }

    async function signUp(email, password) {
      if (!enabled) throw new Error("Cloud sync has not been connected yet.");
      emitStatus("connecting");
      const response = await fetcher(`${baseUrl}/auth/v1/signup`, {
        method: "POST",
        headers: headers(false),
        body: JSON.stringify({ email: String(email).trim(), password })
      });
      const data = await parseResponse(response);
      if (!data.access_token) {
        emitStatus("local", "Check your email to confirm the account, then sign in here.");
        emitAuth({ pendingEmail: String(email).trim() });
        return { needsConfirmation: true, email: String(email).trim() };
      }
      writeSession({ ...data, expires_at: now() + Number(data.expires_in || 3600) * 1000 });
      emitAuth();
      await reconcile();
      return { needsConfirmation: false, email: session.user?.email || email };
    }

    async function signOut() {
      if (session && enabled && isOnline()) {
        try { await authorizedFetch("/auth/v1/logout", { method: "POST" }); } catch { /* Local sign-out still succeeds. */ }
      }
      writeSession(null);
      remoteVersion = 0;
      if (saveTimer) clearTimer(saveTimer);
      saveTimer = null;
      queued = false;
      emitAuth();
      emitStatus(enabled ? "local" : "not-configured");
    }

    async function fetchRemote() {
      const response = await authorizedFetch("/rest/v1/finance_plans?select=payload,version,updated_at&limit=1", {
        method: "GET",
        headers: { Accept: "application/json" }
      });
      const rows = await parseResponse(response);
      return rows?.[0] || null;
    }

    async function saveRemote(payload, expectedVersion = remoteVersion) {
      const response = await authorizedFetch("/rest/v1/rpc/save_finance_plan", {
        method: "POST",
        body: JSON.stringify({ p_payload: payload, p_expected_version: expectedVersion })
      });
      const saved = await parseResponse(response);
      remoteVersion = Number(saved?.version || expectedVersion + 1);
      return saved;
    }

    function newerLocal(local, remote) {
      const localTime = Date.parse(local?.updatedAt || "") || 0;
      const remoteTime = Date.parse(remote?.updatedAt || "") || 0;
      return localTime > remoteTime;
    }

    async function resolveConflict(localPayload) {
      const remote = await fetchRemote();
      if (!remote) {
        remoteVersion = 0;
        return saveRemote(localPayload, 0);
      }
      remoteVersion = Number(remote.version || 0);
      if (newerLocal(localPayload, remote.payload)) return saveRemote(localPayload, remoteVersion);
      bindings.applyRemote(remote.payload, { source: "conflict", updatedAt: remote.updated_at });
      emitStatus("synced", "This device received a newer change from another device.");
      return remote;
    }

    async function reconcile() {
      if (!enabled || !session) return false;
      if (!isOnline()) {
        queued = true;
        emitStatus("offline");
        return false;
      }
      emitStatus("connecting");
      try {
        const remote = await fetchRemote();
        const local = bindings.getState();
        if (!remote) {
          remoteVersion = 0;
          await saveRemote(local, 0);
        } else {
          remoteVersion = Number(remote.version || 0);
          if (!bindings.hasLocalData() || !newerLocal(local, remote.payload)) {
            bindings.applyRemote(remote.payload, { source: "login", updatedAt: remote.updated_at });
          } else {
            await saveRemote(local, remoteVersion);
          }
        }
        queued = false;
        emitStatus("synced");
        return true;
      } catch (error) {
        if (error.status === 401 || error.status === 403) {
          writeSession(null);
          emitAuth();
          emitStatus("error", "Sign in again to continue syncing.");
        } else {
          queued = true;
          emitStatus(isOnline() ? "error" : "offline", error.message);
        }
        return false;
      }
    }

    function queueSave() {
      if (!enabled || !session) return;
      queued = true;
      if (!isOnline()) {
        emitStatus("offline");
        return;
      }
      emitStatus("saving");
      if (saveTimer) clearTimer(saveTimer);
      saveTimer = setTimer(() => {
        saveTimer = null;
        flush();
      }, SAVE_DELAY_MS);
    }

    async function flush() {
      if (!enabled || !session || !queued || flushing) return false;
      if (!isOnline()) {
        emitStatus("offline");
        return false;
      }
      flushing = true;
      queued = false;
      emitStatus("saving");
      const snapshot = JSON.parse(JSON.stringify(bindings.getState()));
      try {
        await saveRemote(snapshot);
        emitStatus("synced");
        return true;
      } catch (error) {
        if (error.message === "sync_conflict" || error.code === "P0001" || /sync_conflict/i.test(error.message)) {
          try {
            await resolveConflict(snapshot);
            return true;
          } catch (conflictError) {
            queued = true;
            emitStatus("error", conflictError.message);
            return false;
          }
        }
        queued = true;
        emitStatus(isOnline() ? "error" : "offline", error.message);
        return false;
      } finally {
        flushing = false;
        if (queued && isOnline()) queueSave();
      }
    }

    async function resetRemote(clearedPayload) {
      if (!enabled || !session) return true;
      if (!isOnline()) throw new Error("Connect to the internet before deleting synced data.");
      const remote = await fetchRemote();
      remoteVersion = Number(remote?.version || 0);
      const payload = { ...clearedPayload, updatedAt: new Date(now()).toISOString(), resetMarker: `${now()}` };
      try {
        await saveRemote(payload, remoteVersion);
      } catch (error) {
        if (!(error.message === "sync_conflict" || error.code === "P0001" || /sync_conflict/i.test(error.message))) throw error;
        const newest = await fetchRemote();
        remoteVersion = Number(newest?.version || 0);
        await saveRemote(payload, remoteVersion);
      }
      queued = false;
      emitStatus("synced", "Synced financial information cleared.");
      return true;
    }

    async function restore() {
      emitAuth();
      if (!enabled) {
        emitStatus("not-configured");
        return false;
      }
      if (!session) {
        emitStatus("local");
        return false;
      }
      return reconcile();
    }

    function handleOnline() {
      if (session) reconcile();
      else emitStatus(enabled ? "local" : "not-configured");
    }

    function handleOffline() {
      if (session) emitStatus("offline");
    }

    return {
      bind,
      restore,
      reconcile,
      queueSave,
      flush,
      signIn,
      signUp,
      signOut,
      resetRemote,
      handleOnline,
      handleOffline,
      isEnabled: () => enabled,
      isSignedIn: () => Boolean(session),
      getEmail: () => session?.user?.email || "",
      getRemoteVersion: () => remoteVersion
    };
  }

  root.FinanceCloud = { createCloudSync, SESSION_KEY };
  if (typeof module !== "undefined" && module.exports) module.exports = { createCloudSync, SESSION_KEY };
})(typeof window !== "undefined" ? window : globalThis);
