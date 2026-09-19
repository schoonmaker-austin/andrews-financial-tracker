(function () {
  "use strict";
  const L = window.FinanceLogic;
  const P = window.FinancePlan;
  const STORAGE_KEY = "financial-reset-planner-v1";
  const SAMPLE_MODE = new URLSearchParams(location.search).get("sample") === "1";
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const money = amount => L.signedNumber(amount) === null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: L.signedNumber(amount) % 1 ? 2 : 0 }).format(L.signedNumber(amount));
  const esc = text => String(text ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  const id = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
  let state = load();
  let toastTimer;
  let applyingRemote = false;
  const cloud = window.FinanceCloud?.createCloudSync(window.FINANCE_CLOUD_CONFIG || {});

  const categories = {
    essential: ["Rent", "Electricity", "Gas", "Water", "Phone", "Internet", "Car payment", "Car insurance", "Health insurance", "Fuel", "Basic groceries", "Required medication", "Minimum required debt payments", "Court/legal obligations", "Other mandatory expense"],
    flexible: ["Household goods", "Clothing", "Car maintenance", "Personal care", "Gym", "Pets", "Miscellaneous"],
    discretionary: ["Restaurants", "Fast food", "Coffee", "Alcohol", "Dates & social activities", "Entertainment", "Bars", "Movies", "Shopping", "Subscriptions", "Streaming", "Hobbies", "Trips", "Gifts", "Other"]
  };
  const rules = [
    "Every dollar needs a job.", "Rent money is not spending money.", "Never spend based on income you hope to earn.", "Budget using dependable income.", "Separate needs from wants.", "Check your bank account before spending.", "If you cannot pay cash for entertainment, you cannot currently afford it.", "Unexpected expenses are often predictable categories with unpredictable timing.", "Higher income does not fix uncontrolled spending.", "When income rises, increase savings before lifestyle.", "A budget is permission to spend intentionally, not punishment.", "Protect yourself from the $300–$1,000 emergencies first.", "Pay yourself first when financially stable.", "Automate recurring financial decisions whenever possible.", "Review progress weekly, not only when something goes wrong."
  ];
  const checkins = ["Check checking balance", "Check upcoming bills", "Compare spending against weekly limits", "Review restaurant and date spending", "Update debt balances", "Update emergency fund", "Check income expected during the next 14 days", "Check upcoming irregular expenses", "Decide whether discretionary spending needs to change"];
  const education = [
    ["Emergency funds", "Cash reserved for real problems keeps a tire, tow, or copay from becoming new debt."],
    ["Needs vs. wants", "A need protects housing, health, work, or a required obligation. A want can be delayed without immediate harm."],
    ["Lifestyle inflation", "When income rises, spending often rises with it. Increase saving first so better months create progress."],
    ["Opportunity cost", "Every dollar used one way is unavailable elsewhere. A $60 dinner may also be six-tenths of a $100 buffer."],
    ["Compound interest", "Interest earns interest over time. That helps investments grow, and it makes high-rate debt expensive."],
    ["Avalanche vs. snowball", "Avalanche targets the highest rate and usually costs less. Snowball targets the smallest balance for faster wins."],
    ["Sinking funds", "Save a little each month for predictable categories with unpredictable timing, such as tires or dental work."],
    ["Zero-based budgeting", "Give each dependable dollar a job until income minus planned spending equals zero."],
    ["Pay yourself first", "When stable, move savings before optional spending so progress does not depend on leftovers."],
    ["Automating finances", "Automatic transfers and bill payments reduce missed decisions. Keep enough checking cushion before automating."],
    ["Recurring expenses", "Small subscriptions add up, but large recurring costs such as housing and transportation usually matter more."],
    ["Credit cards", "A card is not extra income. Pay the statement balance in full when possible and avoid relying on it for essentials."],
    ["Credit scores", "Payment history, credit use, account age, and applications affect scores. Never miss essentials to chase a score."],
    ["Retirement accounts", "A 401(k) is workplace retirement savings; a Roth IRA uses after-tax money. Employer matching is valuable once crisis needs are covered."],
    ["Index funds", "An index fund spreads money across many investments instead of betting on one company. Fees and risk still matter."],
    ["Dollar-cost averaging", "Investing a consistent amount on a schedule reduces the pressure to guess the perfect day to buy."],
    ["Avoiding lifestyle creep", "When a good month arrives, assign extra money before it feels available to spend."]
  ];

  function load() {
    if (SAMPLE_MODE) {
      return L.normalize({
        demo: true,
        profile: { checking: "125", savings: "0", cash: "40", otherLiquid: "0", nextPaycheckAmount: "1250", unpaidRent: "400", overdueBills: "150" },
        income: { dependable: "2450", average: "2900", high: "3800", received: "1250", expected: "1250", entries: [] },
        expenses: [
          { id: "s1", category: "Rent", amount: "1350", classification: "essential", recurring: true },
          { id: "s2", category: "Electricity", amount: "160", classification: "essential", recurring: true },
          { id: "s3", category: "Car insurance", amount: "180", classification: "essential", recurring: true },
          { id: "s4", category: "Fuel", amount: "240", classification: "essential", recurring: true },
          { id: "s5", category: "Basic groceries", amount: "480", classification: "essential", recurring: true },
          { id: "s6", category: "Restaurants", amount: "620", classification: "discretionary", recurring: true },
          { id: "s7", category: "Dates & social activities", amount: "400", classification: "discretionary", recurring: true },
          { id: "s8", category: "Subscriptions", amount: "65", classification: "discretionary", recurring: true }
        ],
        debts: [
          { id: "d1", name: "Court obligation", creditor: "County court", balance: "600", rate: "0", minimum: "100", type: "Court/legal", required: true },
          { id: "d2", name: "Dental bill", creditor: "Dental office", balance: "1800", rate: "8", minimum: "75", type: "Dental", required: false }
        ]
      });
    }
    try { return L.normalize(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch { return L.defaultState(); }
  }
  function save(show = false) {
    if (!applyingRemote) state.updatedAt = new Date().toISOString();
    if (SAMPLE_MODE) {
      $("#saveStatus").textContent = "Sample changes only · not saved";
      if (show) notify("Sample updated. Your saved plan is unchanged.");
      return true;
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { $("#saveStatus").textContent = "Not saved · download a backup"; if (show) notify("This browser could not save. Download a backup to keep your numbers."); return false; }
    $("#saveStatus").textContent = "Saved locally just now";
    if (!applyingRemote) cloud?.queueSave();
    if (show) notify(cloud?.isSignedIn() ? "Saved here and queued for device sync." : "Saved on this device.");
    return true;
  }
  function notify(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function applyRemoteState(payload, metadata = {}) {
    applyingRemote = true;
    state = L.normalize(payload);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { notify("The synced plan opened, but this device could not keep an offline copy."); }
    applyingRemote = false;
    populateForm($("#snapshotForm"), state.profile);
    populateForm($("#incomeForm"), state.income);
    populateQuickSetup();
    syncTrackingPeriod();
    $$(`input[name="debtStrategy"]`).forEach(input => input.checked = input.value === state.settings.debtStrategy);
    renderAll();
    if (metadata.source === "conflict") notify("A newer change from another device is now shown here.");
    else if (metadata.source === "login") notify("Andrew's synced plan is ready on this device.");
  }

  function cloudStatusText(status) {
    return ({
      "not-configured": "Saved on this device",
      local: "Saved on this device",
      connecting: "Connecting device sync…",
      saving: "Saving to Andrew's devices…",
      synced: "Saved on all devices",
      offline: "Offline · saved on this device",
      error: "Saved here · sync needs attention"
    })[status] || "Saved on this device";
  }

  function handleCloudStatus({ status, detail, signedIn }) {
    if (SAMPLE_MODE) return;
    const text = cloudStatusText(status);
    setText("#saveStatus", text);
    setText("#privacyText", signedIn ? text : "Saved on this device");
    const privacy = $("#privacyNote");
    const card = $(".sync-state-card");
    if (privacy) privacy.dataset.syncState = status;
    if (card) card.dataset.syncState = status;
    setText("#dialogSyncStatus", text);
    setText("#dialogSyncDetail", detail || (status === "offline" ? "Keep working. Changes will sync when this device reconnects." : status === "error" ? "Open device sync and try again." : "This device has the newest saved plan."));
    const button = $("#accountButton");
    if (button) button.dataset.state = status;
  }

  function handleCloudAuth({ enabled, signedIn, email, pendingEmail }) {
    $("#signedOutAccount").hidden = signedIn;
    $("#signedInAccount").hidden = !signedIn;
    setText("#signedInEmail", email ? `Signed in as ${email}` : "Signed in");
    setText("#accountButton", signedIn ? "Synced" : "Sync devices");
    const trustCopy = $("#setupTrust span:last-child");
    if (trustCopy) trustCopy.textContent = signedIn ? "Saved here and synced across Andrew's devices." : "Saved in this browser. Sign in to use the same plan on every device.";
    if (!enabled) setAccountMessage("Device sync is ready in the app but still needs its secure cloud connection.", false);
    else if (pendingEmail) setAccountMessage(`Check ${pendingEmail} for the confirmation link, then sign in here.`, true);
  }

  function setAccountMessage(message, success = false) {
    const element = $("#accountMessage");
    if (!element) return;
    element.textContent = message || "";
    element.classList.toggle("is-success", Boolean(success));
  }

  async function submitAccount(mode) {
    const form = $("#accountForm");
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    if (!form.reportValidity()) return;
    const buttons = [$("#signInButton"), $("#createAccountButton")];
    buttons.forEach(button => { button.disabled = true; });
    setAccountMessage(mode === "create" ? "Creating Andrew's private account…" : "Signing in…", true);
    try {
      const result = mode === "create" ? await cloud.signUp(email, password) : await cloud.signIn(email, password);
      if (result.needsConfirmation) setAccountMessage(`Check ${result.email} for the confirmation link, then sign in here.`, true);
      else {
        setAccountMessage("");
        form.elements.password.value = "";
        $("#accountDialog").close();
        notify("Device sync is on. Andrew's newest plan will appear everywhere he signs in.");
      }
    } catch (error) {
      const message = String(error?.message || "");
      if (mode === "signin" && /invalid login credentials/i.test(message)) {
        setAccountMessage("That email and password do not match a tracker account. If this is your first time, choose Create account. Otherwise, check the password and confirm the email first.");
      } else {
        setAccountMessage(message || "Device sync could not sign in. Check the email and password, then try again.");
      }
    } finally {
      buttons.forEach(button => { button.disabled = false; });
    }
  }
  function formToObject(form) { return Object.fromEntries(new FormData(form).entries()); }
  function populateForm(form, data) { Object.entries(data).forEach(([key, val]) => { const input = form.elements[key]; if (input) input.value = val ?? ""; }); }
  function setText(selector, value) { const el = $(selector); if (el) el.textContent = value; }
  function valueKnown(raw) { return L.n(raw) !== null; }
  function selectedPeriodDate() {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return state.settings.trackingPeriod === L.currentPeriod(now) ? today : `${state.settings.trackingPeriod}-01`;
  }
  function syncTrackingPeriod() {
    $$('[data-tracking-period]').forEach(input => { input.value = state.settings.trackingPeriod; });
    [$("#incomeEntryForm")?.elements.date, $("#transactionForm")?.elements.date].forEach(input => {
      if (input && !input.value) input.value = selectedPeriodDate();
    });
  }

  function animateView(element) {
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.animate(
      [
        { clipPath: "inset(0 0 14% 0)", filter: "saturate(.78)" },
        { clipPath: "inset(0)", filter: "saturate(1)" }
      ],
      { duration: 360, easing: "cubic-bezier(.16,1,.3,1)" }
    );
  }

  function navigate(view, animate = true) {
    const dataMenu = $(".data-menu");
    if (dataMenu) dataMenu.open = false;
    $$(".view").forEach(el => el.classList.toggle("is-active", el.dataset.view === view));
    $$("[data-nav]").forEach(el => {
      const active = el.dataset.nav === view;
      el.classList.toggle("is-active", active);
      if (active) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current");
    });
    const title = $(`[data-nav="${view}"]`)?.textContent.trim() || "Andrew's Financial Tracker";
    setText("#pageTitle", title);
    $("#mobileNav").hidden = true;
    $("#mobileMenu").setAttribute("aria-expanded", "false");
    if (view === "setup") { populateQuickSetup(); showSetupStep(state.settings.onboardingComplete ? 1 : state.settings.setupStep, false, animate); }
    window.scrollTo({ top: 0, behavior: "instant" });
    renderAll();
    const surface = $(`.view[data-view="${view}"]`);
    if (animate) {
      animateView(surface);
      if (view !== "setup") {
        const heading = $("h1", surface);
        if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      }
    }
  }

  function hasFinancialData() {
    return Boolean(
      state.settings.onboardingComplete ||
      Object.values(state.profile).some(valueKnown) ||
      [state.income.dependable, state.income.average, state.income.received].some(valueKnown) ||
      state.income.entries.length || state.expenses.length || state.transactions.length || state.debts.length || state.monthlySnapshots.length
    );
  }

  function populateQuickSetup() {
    const form = $("#quickSetupForm");
    const analysis = L.analyze(state);
    form.elements.dependable.value = state.income.dependable ?? "";
    form.elements.essentialTotal.value = state.settings.essentialSource === "detailed" ? analysis.expenses.essential : state.settings.quickEssentialTotal ?? "";
    form.elements.debtMinimums.value = state.settings.debtMinimumSource === "detailed" ? analysis.plannedDebtMinimums : state.settings.quickDebtMinimums ?? "";
    ["dependable", "essentialTotal", "debtMinimums"].forEach(name => validateSetupField(form.elements[name]));
  }

  function validateSetupField(input) {
    const invalid = input.value.trim() !== "" && L.n(input.value) === null;
    const error = $(`#${input.name}Error`);
    input.setAttribute("aria-invalid", String(invalid));
    error.hidden = !invalid;
    error.textContent = invalid ? "Enter an amount like 3,200 or $3,200.50, or leave this blank. Use 0 if none." : "";
    return !invalid;
  }

  function showSetupStep(step, animate = true, moveFocus = true) {
    step = Math.max(1, Math.min(3, Number(step) || 1));
    state.settings.setupStep = step;
    $$("[data-setup-step]").forEach(panel => {
      const active = Number(panel.dataset.setupStep) === step;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    setText("#setupStepLabel", `Question ${step} of 3`);
    $("#setupProgressBar").style.transform = `scaleX(${step / 3})`;
    setText("#setupNext", step === 3 ? "See Andrew's monthly picture" : "Continue");
    $("#setupBack").hidden = step === 1;
    const panel = $(`[data-setup-step="${step}"]`);
    if (animate) animateView(panel);
    if (moveFocus) {
      const focusTarget = window.matchMedia("(max-width: 760px)").matches ? $("legend", panel) : $("input", panel);
      focusTarget.tabIndex = focusTarget.tagName === "LEGEND" ? -1 : 0;
      focusTarget.focus({ preventScroll: true });
    }
  }

  function saveQuickSetup(complete = false, changedName = "") {
    const values = formToObject($("#quickSetupForm"));
    state.income.dependable = values.dependable;
    if (changedName === "essentialTotal") { state.settings.quickEssentialTotal = values.essentialTotal; state.settings.essentialSource = "estimate"; }
    if (changedName === "debtMinimums") { state.settings.quickDebtMinimums = values.debtMinimums; state.settings.debtMinimumSource = "estimate"; }
    state.settings.setupStarted = true;
    if (complete) state.settings.onboardingComplete = true;
    return save();
  }

  function finishQuickSetup() {
    const saved = saveQuickSetup(true);
    populateForm($("#incomeForm"), state.income);
    navigate("dashboard");
    notify(!saved ? "Andrew's picture is available for this visit. Download a backup because this browser could not save." : L.analyze(state).monthlyReady ? "Andrew's monthly picture is ready." : "Andrew's numbers are saved. Add the missing amounts whenever you’re ready.");
  }

  function advanceSetup() {
    const input = $("[data-setup-step].is-active input");
    if (!validateSetupField(input)) { input.focus(); return; }
    if (state.settings.setupStep === 3) finishQuickSetup();
    else { saveQuickSetup(); showSetupStep(state.settings.setupStep + 1); save(); }
  }

  function activateSpendingTab(tab, moveFocus = false) {
    const tabs = $$(`[data-spending-tab]`);
    tabs.forEach(el => {
      const active = el === tab;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-selected", String(active));
      el.tabIndex = active ? 0 : -1;
    });
    $$(`[data-spending-panel]`).forEach(panel => panel.hidden = panel.dataset.spendingPanel !== tab.dataset.spendingTab);
    if (moveFocus) tab.focus();
  }

  function initialize() {
    if (state.demo) {
      $("#saveStatus").textContent = "Sample plan: fictional data";
      $("#accountButton").hidden = true;
    } else {
      cloud?.bind({
        getState: () => state,
        applyRemote: applyRemoteState,
        hasLocalData: hasFinancialData,
        onStatus: handleCloudStatus,
        onAuth: handleCloudAuth
      });
    }
    const categorySelect = $("#expenseCategory");
    Object.entries(categories).forEach(([group, names]) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group === "essential" ? "Essential / survival" : group === "flexible" ? "Flexible but legitimate" : "Discretionary";
      names.forEach(name => { const option = document.createElement("option"); option.textContent = name; option.value = name; option.dataset.classification = group; optgroup.append(option); });
      categorySelect.append(optgroup);
    });
    populateForm($("#snapshotForm"), state.profile);
    populateForm($("#incomeForm"), state.income);
    populateQuickSetup();
    syncTrackingPeriod();
    $$(`input[name="debtStrategy"]`).forEach(input => input.checked = input.value === state.settings.debtStrategy);
    $("#rulesList").innerHTML = rules.map(rule => `<div class="rule">${esc(rule)}</div>`).join("");
    $("#checkinList").innerHTML = checkins.map((item, index) => `<label class="checkin-item"><input type="checkbox" data-checkin="${index}" ${state.checkin[index] ? "checked" : ""}><span>${esc(item)}</span></label>`).join("");
    $("#educationCards").innerHTML = education.map(([title, copy]) => `<article class="education-card"><h2>${esc(title)}</h2><p>${esc(copy)}</p></article>`).join("");
    setupEvents();
    renderAll();
    if (!SAMPLE_MODE) cloud?.restore();
    if (new URLSearchParams(location.search).get("report") === "1") generateReport(true);
    else if (new URLSearchParams(location.search).get("plan") === "1") navigate("plan", false);
    else if ((state.settings.setupStarted && !state.settings.onboardingComplete) || !hasFinancialData()) navigate("setup", false);
  }

  function setupEvents() {
    $$("[data-nav]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.nav)));
    document.addEventListener("click", event => {
      if (event.target.closest("[data-reset]")) showResetWarning();
      const jump = event.target.closest("[data-nav-jump]"); if (jump) {
        navigate(jump.dataset.navJump);
        if (jump.dataset.setupQuestion) showSetupStep(Number(jump.dataset.setupQuestion));
      }
      const source = event.target.closest("[data-total-source]");
      if (source) { state.settings[source.dataset.totalSource] = source.dataset.source; save(); renderAll(); notify("Andrew's monthly picture now uses that total."); }
      const generate = event.target.closest("[data-generate]"); if (generate) generateReport();
      handlePlanClick(event);
      const cancel = event.target.closest("[data-cancel-edit]"); if (cancel) resetItemForm(cancel.closest("form"));
      const edit = event.target.closest("[data-edit]"); if (edit) editItem(edit.dataset.edit, edit.dataset.id);
      const remove = event.target.closest("[data-remove]"); if (remove) removeItem(remove.dataset.remove, remove.dataset.id);
    });
    $("#guidedPlan").addEventListener("submit", handlePlanSubmit);
    $("#guidedPlan").addEventListener("input", event => {
      const input = event.target;
      if (input.dataset.planDraft) { state.actionPlan.drafts[input.dataset.planDraft] = input.value; save(); }
    });
    $("#mobileMenu").addEventListener("click", () => {
      $(".data-menu").open = false;
      const menu = $("#mobileNav");
      const links = $(".mobile-nav-links", menu);
      if (!links.childElementCount) links.innerHTML = $(".nav-list").innerHTML;
      menu.hidden = !menu.hidden;
      $("#mobileMenu").setAttribute("aria-expanded", String(!menu.hidden));
      $$(`[data-nav]`, links).forEach(button => button.onclick = () => navigate(button.dataset.nav));
    });
    $("#mobileImportButton").addEventListener("click", () => $("#importInput").click());
    $("#accountButton").addEventListener("click", () => {
      $(".data-menu").open = false;
      setAccountMessage(cloud?.isEnabled() ? "" : "Device sync is ready in the app but still needs its secure cloud connection.", false);
      $("#accountDialog").showModal();
    });
    $("#closeAccountDialog").addEventListener("click", () => $("#accountDialog").close());
    $("#accountForm").addEventListener("submit", event => { event.preventDefault(); submitAccount("signin"); });
    $("#createAccountButton").addEventListener("click", () => submitAccount("create"));
    $("#syncNowButton").addEventListener("click", async event => {
      event.currentTarget.disabled = true;
      const synced = await cloud.reconcile();
      event.currentTarget.disabled = false;
      notify(synced ? "Andrew's plan is up to date on this device." : "Sync could not finish. Your changes are still saved here.");
    });
    $("#signOutButton").addEventListener("click", async () => {
      await cloud.signOut();
      $("#accountDialog").close();
      notify("Signed out on this device. The offline copy is still here.");
    });
    window.addEventListener("online", () => cloud?.handleOnline());
    window.addEventListener("offline", () => cloud?.handleOffline());
    $("#setupBack").addEventListener("click", () => { saveQuickSetup(); showSetupStep(state.settings.setupStep - 1); save(); });
    $("#quickSetupForm").addEventListener("input", event => {
      if (!event.target.name) return;
      validateSetupField(event.target);
      saveQuickSetup(false, event.target.name);
    });
    $("#quickSetupForm").addEventListener("submit", event => { event.preventDefault(); advanceSetup(); });
    $("#setupSkipQuestion").addEventListener("click", () => {
      const input = $("[data-setup-step].is-active input");
      input.value = "";
      validateSetupField(input);
      saveQuickSetup(false, input.name);
      advanceSetup();
    });
    $("#noDebtPayments").addEventListener("click", () => {
      const input = $("#quickSetupForm").elements.debtMinimums;
      input.value = "0";
      validateSetupField(input);
      saveQuickSetup(false, input.name);
      finishQuickSetup();
    });
    $$(`[data-skip-setup]`).forEach(button => button.addEventListener("click", finishQuickSetup));
    $("#snapshotForm").addEventListener("input", event => { state.profile[event.target.name] = event.target.value; save(); renderAll(); });
    $("#incomeForm").addEventListener("input", event => { state.income[event.target.name] = event.target.value; save(); renderAll(); });
    $("#incomeEntryForm").addEventListener("submit", event => { event.preventDefault(); const item = formToObject(event.target); state.income.entries.push({ id: id(), ...item }); event.target.reset(); syncTrackingPeriod(); save(); renderAll(); });
    $("#expenseCategory").addEventListener("change", event => { const option = event.target.selectedOptions[0]; $("#expenseForm").elements.classification.value = option.dataset.classification || "flexible"; });
    $("#expenseForm").addEventListener("submit", event => { event.preventDefault(); const item = formToObject(event.target); item.category = item.custom || item.category; item.recurring = event.target.elements.recurring.checked; delete item.custom; if (event.target.dataset.editId) state.expenses = state.expenses.map(old => old.id === event.target.dataset.editId ? { ...old, ...item } : old); else state.expenses.push({ id: id(), ...item }); resetItemForm(event.target); save(); renderAll(); });
    $("#transactionForm").addEventListener("submit", event => { event.preventDefault(); state.transactions.push({ id: id(), ...formToObject(event.target) }); event.target.reset(); syncTrackingPeriod(); save(); renderAll(); });
    $$('[data-tracking-period]').forEach(input => input.addEventListener("change", event => {
      const period = L.periodKey(event.target.value);
      if (!period) return;
      state.settings.trackingPeriod = period;
      syncTrackingPeriod();
      save();
      renderAll();
    }));
    $("#debtForm").addEventListener("submit", event => { event.preventDefault(); const item = formToObject(event.target); item.required = event.target.elements.required.checked; item.interestBearing = event.target.elements.interestBearing.checked; if (event.target.dataset.editId) state.debts = state.debts.map(old => old.id === event.target.dataset.editId ? { ...old, ...item } : old); else state.debts.push({ id: id(), ...item }); resetItemForm(event.target); save(); renderAll(); });
    $("#sinkingForm").addEventListener("submit", event => { event.preventDefault(); state.sinkingFunds.push({ id: id(), ...formToObject(event.target) }); event.target.reset(); save(); renderAll(); });
    $$(`input[name="debtStrategy"]`).forEach(input => input.addEventListener("change", event => { state.settings.debtStrategy = event.target.value; save(); renderAll(); }));
    $$(`[data-spending-tab]`).forEach(tab => {
      tab.addEventListener("click", () => activateSpendingTab(tab));
      tab.addEventListener("keydown", event => {
        const tabs = $$(`[data-spending-tab]`);
        const index = tabs.indexOf(tab);
        let next = null;
        if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
        if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
        if (event.key === "Home") next = tabs[0];
        if (event.key === "End") next = tabs[tabs.length - 1];
        if (next) { event.preventDefault(); activateSpendingTab(next, true); }
      });
    });
    $("#checkinList").addEventListener("change", event => { state.checkin[event.target.dataset.checkin] = event.target.checked; save(); });
    $("#exportButton").addEventListener("click", exportJson);
    $("#importInput").addEventListener("change", importJson);
    $("#cancelResetButton").addEventListener("click", () => $("#resetDialog").close());
    $("#confirmResetButton").addEventListener("click", resetData);
    $("#resetBackupButton").addEventListener("click", exportJson);
    window.addEventListener("storage", event => {
      if (!SAMPLE_MODE && (event.key === STORAGE_KEY || event.key === null) && event.newValue === null) {
        clearEnteredData();
        notify("Data was cleared in another tab. This tab has also been reset.");
      }
    });
    $("#printButton").addEventListener("click", () => { if (!state.generatedAt) generateReport(false); window.print(); });
  }

  function removeItem(collection, itemId) {
    if (collection === "income") state.income.entries = state.income.entries.filter(item => item.id !== itemId);
    else state[collection] = state[collection].filter(item => item.id !== itemId);
    save(); renderAll();
  }

  function renderAll() {
    const a = L.analyze(state);
    syncTrackingPeriod();
    renderDashboard(a); renderSnapshot(a); renderIncome(a); renderSpending(a); renderDebts(a); renderPlan(a); renderGuidedPlan(); renderRoadmap(a);
    if (state.generatedAt) renderReport(a);
  }

  function renderDashboard(a) {
    const notice = $("#dashboardUnknown");
    notice.hidden = a.monthlyReady;
    notice.textContent = `Still needed: ${a.missingMonthly.join(", ")}. Andrew's entered numbers are saved. We’ll show the difference once these amounts are known.`;
    $("#diagnosisPanel").classList.toggle("is-crisis", a.monthlyReady && a.monthlySurplus < 0);
    setText("#stageName", !a.monthlyReady ? "Andrew's picture is taking shape" : a.monthlySurplus < 0 ? "Monthly costs exceed Andrew's income" : a.monthlySurplus === 0 ? "Andrew's monthly costs match his income" : "Here’s what remains after Andrew's entered costs");
    setText("#stageMessage", a.monthlyReady ? `${money(Math.abs(a.monthlySurplus))} ${a.monthlySurplus < 0 ? "short each month" : "left each month"}, based on Andrew's estimates.` : "Start with what you know.");
    setText("#stageReason", a.monthlyReady ? "This is a monthly estimate, not cash available to spend today. Any costs you haven’t included will reduce what’s left." : "A skipped amount stays unknown. You can add it whenever you’re ready.");
    setText("#dashDependable", a.unknown.dependableIncome ? "Not entered" : money(a.income.dependable));
    setText("#dashSurvival", a.essentialKnown && a.debtMinimumsKnown ? money(a.expenses.total + a.plannedDebtMinimums) : "Not complete");
    setText("#dashSurplus", a.monthlyReady ? money(a.monthlySurplus) : "Not yet known");
    $("#dashSurplus").className = a.monthlyReady ? a.monthlySurplus < 0 ? "negative" : "positive" : "";
    setText("#milestoneName", a.stageReady ? `Next checkpoint: ${money(a.emergencyTarget)}` : "Add cash and savings when you’re ready");
    setText("#milestoneAmount", a.savingsKnown ? `${money(a.emergency)} saved` : "");
    $("#milestoneProgressTrack").hidden = !a.stageReady;
    $("#milestoneProgress").style.transform = `scaleX(${a.progress / 100})`;
    $("#milestoneProgressTrack").setAttribute("aria-valuenow", String(a.progress));
    $("#milestoneProgressTrack").setAttribute("aria-valuetext", `${money(a.emergency)} of ${money(a.emergencyTarget)} saved`);
    setText("#milestoneCaption", a.stageReady ? `${money(a.emergency)} of ${money(a.emergencyTarget)} saved toward the next checkpoint. Longer reserve target: ${money(a.reserveTarget)}.` : "Optional: your balances and overdue bills help explain what needs attention today.");
    const guided = P.build(state);
    $("#todayActions").innerHTML = `<li><button class="text-button" data-nav-jump="plan">${esc(guided.current ? guided.current.title : "Do your weekly money check-in")}</button><p>${guided.completed} of ${guided.total} plan steps complete</p></li>`;
    setText("#dashChecking", L.signedNumber(state.profile.checking) !== null ? money(state.profile.checking) : "Not entered");
    setText("#dashEmergency", a.savingsKnown ? money(a.emergency) : "Not entered");
    setText("#dashSpending", a.essentialKnown && a.debtMinimumsKnown ? money(a.expenses.total + a.plannedDebtMinimums) : "Not complete");
    setText("#dashSafe", a.monthlyReady ? money(a.monthlySurplus - L.sum(state.sinkingFunds.map(f => f.monthly))) : "Not yet known");
  }

  function renderSnapshot(a) {
    const days = date => { if (!date) return "Unknown"; return Math.ceil((new Date(`${date}T12:00:00`) - new Date()) / 86400000); };
    $("#snapshotSummary").innerHTML = `<div><span>Total liquid cash</span><strong>${money(a.liquid)}</strong></div><div><span>Cash after immediate obligations</span><strong class="${a.availableAfterImmediate < 0 ? "negative" : ""}">${money(a.availableAfterImmediate)}</strong></div><div><span>Days until rent / paycheck</span><strong>${days(state.profile.rentDueDate)} / ${days(state.profile.nextPaycheckDate)}</strong></div>`;
  }

  function renderIncome(a) {
    const visible = state.income.entries.filter(item => L.periodKey(item.date) === a.period || !L.periodKey(item.date));
    const undatedNote = a.income.undatedEntries ? ` ${a.income.undatedEntries} older ${a.income.undatedEntries === 1 ? "entry has" : "entries have"} no date and ${a.income.undatedEntries === 1 ? "is" : "are"} not included.` : "";
    $("#incomePeriodSummary").innerHTML = `<div><span>Received · ${esc(a.periodLabel)}</span><strong>${money(a.income.received)}</strong></div><div><span>Still expected · ${esc(a.periodLabel)}</span><strong>${money(a.income.expected)}</strong></div><div><span>Recorded total</span><strong>${money(a.income.projected)}</strong></div><p>${a.income.periodEntries.length ? `${a.income.periodEntries.length} dated ${a.income.periodEntries.length === 1 ? "entry" : "entries"} included.` : "No dated income entries are recorded for this month."}${esc(undatedNote)}</p>`;
    $("#incomeEntries").innerHTML = visible.length ? visible.map(item => {
      const dated = L.periodKey(item.date);
      return `<div class="data-row"><div class="row-main"><strong>${esc(item.type)}</strong><small>${dated ? esc(item.date) : "No date · not included in month totals"} · ${esc(item.status)}</small></div><span class="amount">${money(item.amount)}</span><span></span><span></span><button class="button button-quiet button-small row-actions" data-remove="income" data-id="${esc(item.id)}">Remove</button></div>`;
    }).join("") : `<div class="empty-state">No income entries for ${esc(a.periodLabel)}. Add a paycheck or choose another month.</div>`;
  }

  function renderSpending(a) {
    const quickTotal = state.settings.quickEssentialTotal;
    const detailedEssentials = state.expenses.some(item => item.classification === "essential" && valueKnown(item.amount));
    const baselineNotice = $("#spendingBaselineNotice");
    baselineNotice.hidden = !valueKnown(quickTotal);
    baselineNotice.textContent = a.expenses.usingEstimate
      ? `Andrew's ${money(quickTotal)} rough monthly total is still in use. Bills entered so far: ${money(a.expenses.detailedEssential)}. Switch only when the list includes all essentials.`
      : `Andrew's monthly picture uses ${money(a.expenses.detailedEssential)} in individual essential bills. His rough estimate is kept for reference: ${money(quickTotal)}.`;
    $("#expenseSourceActions").innerHTML = detailedEssentials
      ? `<button class="button button-secondary" data-total-source="essentialSource" data-source="${state.settings.essentialSource !== "detailed" ? "detailed" : "estimate"}">${state.settings.essentialSource !== "detailed" ? "All essential bills entered — use this total" : "Use my rough estimate again"}</button>` : "";
    if (state.settings.essentialSource === "detailed" && !valueKnown(quickTotal)) $("#expenseSourceActions").innerHTML = '<button class="button button-secondary" data-nav-jump="setup" data-setup-question="2">Enter a rough estimate instead</button>';
    $("#expenseList").innerHTML = state.expenses.length ? state.expenses.map(item => `<div class="data-row"><div class="row-main"><strong>${esc(item.category)}</strong><small>${esc(item.classification)}${item.dueDate ? ` · due day ${esc(item.dueDate)}` : ""}${item.notes ? ` · ${esc(item.notes)}` : ""}</small></div><span class="amount">${valueKnown(item.amount) ? money(item.amount) : "Unknown"}</span><span>${item.recurring ? "Recurring" : "One-time"}</span><span></span><span class="row-actions"><button class="button button-quiet button-small" data-edit="expenses" data-id="${esc(item.id)}">Edit</button><button class="button button-quiet button-small" data-remove="expenses" data-id="${esc(item.id)}">Remove</button></span></div>`).join("") : `<div class="empty-state">Add monthly expenses to calculate survival cost, weekly limits, and cash flow.</div>`;
    const visibleTransactions = state.transactions.filter(item => L.periodKey(item.date) === a.period || !L.periodKey(item.date));
    $("#transactionList").innerHTML = visibleTransactions.length ? visibleTransactions.map(item => {
      const dated = L.periodKey(item.date);
      return `<div class="data-row"><div class="row-main"><strong>${esc(item.name)}</strong><small>${esc(item.category)} · ${esc(item.classification)} · ${dated ? esc(item.date) : "No date · not included in month totals"}</small></div><span class="amount">${money(item.amount)}</span><span></span><span></span><button class="button button-quiet button-small row-actions" data-remove="transactions" data-id="${esc(item.id)}">Remove</button></div>`;
    }).join("") : `<div class="empty-state">No transactions for ${esc(a.periodLabel)}. Add one or choose another month.</div>`;
    const income = a.income.dependable;
    const pct = amount => income ? `${L.round(amount / income * 100)}%` : "—";
    const restaurantTarget = Math.min(250, a.spending.restaurants);
    const restaurantFree = Math.max(0, a.spending.restaurants - restaurantTarget);
    $("#auditContent").innerHTML = `
      <div class="notice notice-info"><strong>${esc(a.periodLabel)}</strong> · ${a.spending.transactionCount ? `${a.spending.transactionCount} dated ${a.spending.transactionCount === 1 ? "transaction" : "transactions"}` : "No dated transactions; using monthly estimates"}.${a.spending.undatedTransactions ? ` ${a.spending.undatedTransactions} ${a.spending.undatedTransactions === 1 ? "transaction has" : "transactions have"} no date and ${a.spending.undatedTransactions === 1 ? "is" : "are"} excluded.` : ""}</div>
      <div class="metrics-grid"><div class="metric"><span>Total spending</span><strong>${money(a.spending.total)}</strong></div><div class="metric"><span>Essential</span><strong>${money(a.spending.essential)}</strong></div><div class="metric"><span>Discretionary</span><strong>${money(a.spending.discretionary)}</strong></div><div class="metric"><span>Savings rate</span><strong>${a.savingsRate === null ? "—" : `${a.savingsRate}%`}</strong></div></div>
      <div class="plan-grid"><article class="panel"><h2>Share of dependable income</h2><div class="allocation-list"><div class="allocation-row"><span>Housing</span><strong>${a.percentages ? `${a.percentages.housing}%` : "—"}</strong></div><div class="allocation-row"><span>Transportation</span><strong>${a.percentages ? `${a.percentages.transportation}%` : "—"}</strong></div><div class="allocation-row"><span>Food</span><strong>${a.percentages ? `${a.percentages.food}%` : "—"}</strong></div><div class="allocation-row"><span>Debt minimums</span><strong>${a.percentages ? `${a.percentages.debt}%` : "—"}</strong></div><div class="allocation-row"><span>Discretionary</span><strong>${pct(a.spending.discretionary)}</strong></div></div></article>
      <article class="panel"><h2>Possible room to create</h2><p>Recorded for ${esc(a.periodLabel)}: approximately <strong>${money(a.spending.restaurants)}</strong> eating away from home.</p><p>${restaurantFree > 0 ? `Reducing this to ${money(restaurantTarget)} would free approximately <strong>${money(restaurantFree)}</strong> for the month, or <strong>${money(restaurantFree * 12)}/year</strong> if the same change held for 12 months.` : "This category is already at or below the comparison target of $250."}</p><p>Dates and entertainment: <strong>${money(a.spending.social)}</strong>. Subscriptions: <strong>${money(a.spending.subscriptions)}</strong>.</p></article></div>`;
  }

  function renderDebts(a) {
    const order = L.debtOrder(state, state.settings.debtStrategy);
    $("#debtBaselineNotice").hidden = !valueKnown(state.settings.quickDebtMinimums);
    $("#debtBaselineNotice").textContent = a.usingDebtEstimate
      ? `Andrew's ${money(state.settings.quickDebtMinimums)} rough payment total is still in use. Individual debt minimums entered: ${money(a.debts.minimums)}. Switch when every payment is included.`
      : `Andrew's monthly picture uses ${money(a.debts.minimums)} in individual debt minimums.`;
    $("#debtSourceActions").innerHTML = a.debts.active.length
      ? `<button class="button button-secondary" data-total-source="debtMinimumSource" data-source="${state.settings.debtMinimumSource !== "detailed" ? "detailed" : "estimate"}">${state.settings.debtMinimumSource !== "detailed" ? "All debt payments entered — use this total" : "Use my rough payment total again"}</button>` : "";
    if (state.settings.debtMinimumSource === "detailed" && !valueKnown(state.settings.quickDebtMinimums)) $("#debtSourceActions").innerHTML = '<button class="button button-secondary" data-nav-jump="setup" data-setup-question="3">Enter a rough payment total instead</button>';
    $("#debtSummary").innerHTML = `<div class="metrics-grid"><div class="metric"><span>Total debt</span><strong>${money(a.debts.total)}</strong></div><div class="metric"><span>Monthly minimums</span><strong>${money(a.debts.minimums)}</strong></div><div class="metric"><span>Weighted average rate</span><strong>${a.debts.weightedRate}%</strong></div><div class="metric"><span>Current target</span><strong>${esc(order.primary?.name || "None")}</strong></div></div>${order.protected.length ? `<div class="notice notice-warning">Protected regardless of strategy: ${order.protected.map(item => esc(item.name)).join(", ")}.</div>` : ""}`;
    const ranks = new Map(order.targets.map((item, index) => [item.id, index + 1]));
    $("#debtList").innerHTML = state.debts.length ? state.debts.map(item => `<div class="data-row"><div class="row-main"><strong>${esc(item.name)}</strong><small>${esc(item.type)} · ${esc(item.creditor || "No creditor entered")}${item.required ? " · protected obligation" : ranks.has(item.id) ? ` · target #${ranks.get(item.id)}` : ""}</small></div><span class="amount">${money(item.balance)}</span><span>${L.value(item.rate)}% APR</span><span>${money(item.minimum)}/mo</span><span class="row-actions"><button class="button button-quiet button-small" data-edit="debts" data-id="${esc(item.id)}">Edit</button><button class="button button-quiet button-small" data-remove="debts" data-id="${esc(item.id)}">Remove</button></span></div>`).join("") : `<div class="empty-state">No debts entered. That is different from a confirmed $0 balance. Add any dental, legal, family, auto, or other obligation.</div>`;
  }

  function renderPlan(a) {
    $("#survivalMode").innerHTML = a.stageReady && a.stage.id === 0 ? `<div class="notice notice-danger"><strong>Financial Survival Mode</strong><br>Dependable income: ${money(a.income.dependable)} · Survival expenses: ${money(a.survival)} · Monthly shortfall: ${money(a.monthlySurplus)}.<br>Budgeting alone cannot completely solve this deficit. Expenses must fall, income must rise, or both.</div>` : "";
    $("#emergencyPlan").innerHTML = `<p>This cash prevents a tire, tow, copay, or minor repair from immediately creating a new crisis.</p><div class="progress-track"><span style="width:${a.progress}%"></span></div><div class="allocation-row"><span>Saved now</span><strong>${money(a.emergency)}</strong></div><div class="allocation-row"><span>Next checkpoint</span><strong>${money(a.emergencyTarget)}</strong></div><div class="allocation-row"><span>Longer reserve target</span><strong>${money(a.reserveTarget)}</strong></div>`;
    if (!a.stageReady) $("#emergencyPlan").innerHTML = `<p>${a.savingsKnown ? `${money(a.emergency)} in entered savings.` : "Savings not entered yet."} Add balances and overdue bills before setting a savings milestone.</p><button class="text-button" data-nav-jump="snapshot">Add cash and savings</button>`;
    const weekly = L.weeklyLimits(state);
    $("#weeklyPlan").innerHTML = weekly.length ? `<div class="allocation-list">${weekly.map(item => `<div class="allocation-row"><span>${esc(item.name)}</span><strong>${money(item.amount)}/week</strong></div>`).join("")}<div class="allocation-row"><span><strong>Weekly flexible spending limit</strong></span><strong>${money(L.sum(weekly.map(item => item.amount)))}</strong></div></div>` : `<div class="empty-state">Add optional monthly spending, such as eating out, to see a weekly estimate. <button class="text-button" data-nav-jump="spending">Add monthly spending</button></div>`;
    const paycheck = L.paycheckPlan(state);
    $("#paycheckPlan").innerHTML = paycheck.paycheck ? `<div class="allocation-list"><div class="allocation-row"><span><strong>Paycheck received</strong></span><strong>${money(paycheck.paycheck)}</strong></div>${paycheck.rows.map(row => `<div class="allocation-row"><span>${esc(row.label)}</span><strong>${money(row.amount)}</strong></div>`).join("")}<div class="allocation-row"><span>Remaining</span><strong>${money(paycheck.remaining)}</strong></div></div>` : `<div class="empty-state">Add your next paycheck amount in Cash &amp; upcoming dates. <button class="text-button" data-nav-jump="snapshot">Add my next paycheck</button></div>`;
    if (!a.stageReady || a.expenses.usingEstimate) $("#paycheckPlan").innerHTML = '<p>For a paycheck plan, first add cash details and individual bills with due dates. Your rough monthly total stays available on Home.</p><button class="text-button" data-nav-jump="snapshot">Add paycheck and cash details</button> <button class="text-button" data-nav-jump="spending">Add individual bills</button>';
    $("#extraRule").innerHTML = '<p>Wait until extra income arrives. First cover overdue essentials, upcoming bills, and minimum payments. Then decide what is affordable for the current goal in your action plan.</p><p>A monthly estimate is not a promise that cash is available today.</p>';
    $("#sinkingList").innerHTML = state.sinkingFunds.length ? state.sinkingFunds.map(item => `<div class="data-row"><div class="row-main"><strong>${esc(item.name)}</strong><small>${money(L.value(item.monthly) * 12)} available after one year</small></div><span class="amount">${money(item.monthly)}/mo</span><span></span><span></span><button class="button button-quiet button-small row-actions" data-remove="sinkingFunds" data-id="${item.id}">Remove</button></div>`).join("") : `<div class="empty-state">Example: $40/month toward car maintenance becomes $480/year for repairs.</div>`;
  }

  function planValue(path) {
    if (path.startsWith("debt:")) return state.debts.find(d => d.id === path.slice(5))?.balance ?? "";
    const [group, key] = path.split(".");
    return state[group]?.[key] ?? "";
  }

  function planField(field, formType, stepId) {
    const draftKey = `${formType}:${field.path}`;
    const value = state.actionPlan.drafts[draftKey] ?? planValue(field.path);
    return `<form class="action-answer" data-plan-form="${formType}" data-step-id="${esc(stepId || "")}" novalidate><label for="planAnswer">${esc(field.label)}</label><div class="money-input"><span>$</span><input id="planAnswer" name="answer" inputmode="${field.signed ? "text" : "decimal"}" value="${esc(value)}" aria-describedby="planAnswerHint planActionError" data-plan-draft="${esc(draftKey)}" autocomplete="off"></div><p id="planAnswerHint" class="action-hint">${esc(field.hint)}</p><p id="planActionError" class="field-error" role="alert" hidden></p><button class="button button-primary" type="submit">Save and continue</button><p class="action-hint">Your draft saves as you type. Continue to update the plan.</p></form>`;
  }

  function planSavedNote(stepId) {
    return state.actionPlan.drafts[`note:${stepId}`] ?? state.actionPlan.completed[stepId]?.note ?? "";
  }

  function planNote(step) {
    const key = `note:${step.id}`;
    const note = planSavedNote(step.id);
    return step.noteLabel ? `<label class="action-note">${esc(step.noteLabel)}<textarea name="note" rows="3" maxlength="3000" data-plan-draft="${esc(key)}">${esc(note)}</textarea><span>Saved automatically in this browser.</span></label>` : "";
  }

  function renderGuidedPlan() {
    const plan = P.build(state), step = plan.current;
    let active = "";
    const reviewStep = state.actionPlan.reviewStep;
    if (Number.isInteger(reviewStep) && reviewStep >= 0 && reviewStep <= P.REVIEW_FIELDS.length && !state.actionPlan.reviewPaused) {
      const field = P.REVIEW_FIELDS[reviewStep];
      active = `<article class="action-current"><div class="action-step-meta">Weekly check-in · ${Math.min(reviewStep + 1, P.REVIEW_FIELDS.length + 1)} of ${P.REVIEW_FIELDS.length + 1}</div><h2 id="activePlanHeading" tabindex="-1">${field ? esc(field.label) : "Check your monthly costs and debt statements"}</h2>${field ? planField(field, "weekly", "") : `<p>Check whether bills, optional spending, or debt balances have changed. Update anything that needs it, then finish this review.</p><div class="action-links"><button class="button button-secondary" data-nav-jump="spending">Review spending</button><button class="button button-secondary" data-nav-jump="debts">Update debt balances</button></div><button class="button button-primary" data-plan-finish-review>I’ve reviewed my numbers</button>`}<button class="text-button" data-plan-cancel-review>Continue this check-in later</button></article>`;
    } else if (step) {
      const source = step.source === undefined ? null : P.SOURCES[step.source];
      const progress = step.progress && step.progress.target > 0 ? `<div class="action-goal"><strong>${money(step.progress.current)} <span>of ${money(step.progress.target)}</span></strong><progress value="${Math.min(step.progress.current, step.progress.target)}" max="${step.progress.target}" aria-label="${esc(step.title)}"></progress></div>` : "";
      let action = step.field ? planField(step.field, "field", step.id) : "";
      if (step.kind === "review") action = `<form class="action-answer" data-plan-form="complete" data-step-id="${step.id}">${planNote(step)}<p id="planActionError" class="field-error" role="alert" hidden></p><button class="button button-primary" type="submit">${esc(step.completeLabel)}</button></form>`;
      else if (step.kind === "inventory") action = `<form class="action-answer" data-plan-form="complete" data-step-id="${step.id}"><p id="planActionError" class="field-error" role="alert" hidden></p><button class="button button-primary" type="submit" ${!step.inventoryReady && !step.canConfirmNone ? "disabled" : ""}>${step.canConfirmNone ? "I confirm I have no debts" : "This is my complete debt list"}</button>${!step.inventoryReady && !step.canConfirmNone ? '<p class="action-hint">Add the missing debt details, or update your monthly payment total if you have no debt.</p>' : ""}</form>`;
      else if (step.noteLabel) action += planNote(step);
      active = `<article class="action-current"><div class="action-step-meta">Step ${step.number} of ${plan.total} · ${esc(step.phase)}</div><h2 id="activePlanHeading" tabindex="-1">${esc(step.title)}</h2><p class="action-why">${esc(step.why)}</p>${progress}<ol class="action-instructions">${step.instructions.map(item => `<li>${esc(item)}</li>`).join("")}</ol>${step.result ? `<p class="action-result">${esc(step.result)}</p>` : ""}<div class="action-links">${(step.links || []).map(link => `<button class="button button-secondary" data-nav-jump="${link.view}">${esc(link.label)}</button>`).join("")}</div>${action}${["starter", "paydown", "reserve"].includes(step.id) ? '<button class="text-button" data-plan-change-amount>Change my monthly amount</button>' : ""}${step.kind === "outcome" ? '<p class="action-hint">This milestone completes when your updated numbers reach it. A checkmark alone does not change a balance.</p>' : ""}${source ? `<a class="action-source" href="${source.url}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>` : ""}</article>`;
    } else {
      active = '<article class="action-current"><h2 id="activePlanHeading" tabindex="-1">Andrew\'s current steps are complete.</h2><p>Keep the habits that got you here. A change in income, bills, savings, or debt may reopen a step so the plan stays useful.</p><button class="button button-primary" data-plan-review>Start a weekly check-in</button></article>';
    }
    $("#guidedPlan").innerHTML = `<div class="action-progress"><span><strong>${plan.completed}</strong> of ${plan.total} steps complete</span><progress value="${plan.completed}" max="${plan.total}" aria-label="Action plan progress"></progress></div>${active}
      <section class="weekly-review"><div><h2>Andrew's weekly money check-in</h2><p>${state.actionPlan.lastReview ? `Last completed ${esc(new Date(state.actionPlan.lastReview).toLocaleDateString())}. ${plan.reviewDue ? "Ready for another review." : `Next review ${esc(new Date(plan.nextReview).toLocaleDateString())}.`}` : "About ten minutes: refresh balances, check bills, and adjust Andrew's next step."}</p></div><button class="button button-secondary" data-plan-review>${Number.isInteger(reviewStep) ? "Resume check-in" : "Start check-in"}</button></section>
      <details class="plan-path"><summary>See Andrew's full path · ${plan.total} steps</summary><p>Completed from Andrew's numbers or confirmation. If the facts change, an earlier step may reopen. Later steps are previews, not instructions to move money now.</p>${P.PHASES.map(phase => `<section><h2>${esc(phase)}</h2><ol>${plan.steps.filter(s => s.phase === phase).map(s => `<li><details><summary><span class="step-state ${s.status}">${s.done ? "Complete" : s.status === "current" ? "Next" : "Later"}</span><span>${s.number}. ${esc(s.title)}</span></summary><p>${esc(s.why)}</p><ol>${s.instructions.map(i => `<li>${esc(i)}</li>`).join("")}</ol>${s.result ? `<p>${esc(s.result)}</p>` : ""}${planSavedNote(s.id) ? `<p>Andrew's note: ${esc(planSavedNote(s.id))}</p>` : ""}${s.done && state.actionPlan.completed[s.id] ? `<button class="text-button" data-plan-reopen="${s.id}">Reopen this step</button>` : ""}</details></li>`).join("")}</ol></section>`).join("")}</details>
      <p class="plan-footnote">This plan uses Andrew's entries and confirmations. It does not connect to a bank or move money. Savings targets are planning defaults; timing and individual needs vary.</p>`;
  }

  function planError(message) {
    const el = $("#planActionError");
    if (el) { el.textContent = message; el.hidden = false; $("#planAnswer")?.setAttribute("aria-invalid", "true"); }
    else notify(message);
  }

  function finishPlanUpdate(message) {
    const saved = save();
    populateForm($("#snapshotForm"), state.profile);
    populateForm($("#incomeForm"), state.income);
    populateQuickSetup();
    renderAll();
    $("#activePlanHeading")?.focus({ preventScroll: true });
    $("#guidedPlan .action-current")?.scrollIntoView({ block: "start", behavior: "instant" });
    notify(saved ? message : "Updated for this visit. Download a backup because this browser could not save.");
  }

  function handlePlanSubmit(event) {
    const form = event.target.closest("[data-plan-form]");
    if (!form) return;
    event.preventDefault();
    const type = form.dataset.planForm;
    const plan = P.build(state), step = plan.current;
    try {
      if (type === "complete") {
        const note = form.elements.note?.value || "";
        state = P.complete(state, form.dataset.stepId, note);
        finishPlanUpdate("Step complete. Your next action is ready.");
        return;
      }
      const field = type === "weekly" ? P.REVIEW_FIELDS[state.actionPlan.reviewStep] : step?.id === form.dataset.stepId ? step.field : null;
      if (!field) throw new Error("Your plan has changed. Review the current step and try again.");
      const raw = form.elements.answer.value;
      const amount = field.signed ? L.signedNumber(raw) : L.n(raw);
      if (amount === null || field.positive && amount <= 0) throw new Error(field.positive ? "Choose an amount greater than 0, or return to your monthly costs if nothing is available yet." : "Enter an amount such as 450 or 1,250.50. Use 0 only when the actual amount is zero.");
      if (field.max !== undefined && amount > field.max) throw new Error(`Choose no more than your entered monthly margin of ${money(field.max)}. Review costs first if that estimate is incomplete.`);
      if (field.path.startsWith("debt:")) {
        const debt = state.debts.find(d => d.id === field.path.slice(5));
        if (!debt) throw new Error("This debt is no longer in the list. Review your debt records.");
        debt.balance = String(amount);
      } else {
        const [group, key] = field.path.split(".");
        state[group][key] = String(amount);
        if (key === "quickEssentialTotal") state.settings.essentialSource = "estimate";
        if (key === "quickDebtMinimums") state.settings.debtMinimumSource = "estimate";
      }
      delete state.actionPlan.drafts[`${type}:${field.path}`];
      if (type === "weekly") state.actionPlan.reviewStep += 1;
      finishPlanUpdate("Balance or answer updated. Your plan has been refreshed.");
    } catch (error) { planError(error.message); }
  }

  function handlePlanClick(event) {
    if (event.target.closest("[data-plan-change-amount]")) {
      state.actionPlan.drafts["field:actionPlan.contribution"] = state.actionPlan.contribution;
      state.actionPlan.contribution = "";
      finishPlanUpdate("Choose a monthly amount that works for you now.");
    }
    if (event.target.closest("[data-plan-review]")) {
      if (!Number.isInteger(state.actionPlan.reviewStep) || state.actionPlan.reviewStep < 0 || state.actionPlan.reviewStep > P.REVIEW_FIELDS.length) state.actionPlan.reviewStep = 0;
      state.actionPlan.reviewPaused = false;
      navigate("plan"); save(); $("#activePlanHeading")?.focus({ preventScroll: true });
    }
    if (event.target.closest("[data-plan-cancel-review]")) { state.actionPlan.reviewPaused = true; finishPlanUpdate("Check-in paused. Your answers are saved."); }
    if (event.target.closest("[data-plan-finish-review]")) {
      if (state.actionPlan.reviewStep !== P.REVIEW_FIELDS.length) return;
      const plan = P.build(state), at = new Date().toISOString();
      state.actionPlan.lastReview = at;
      state.actionPlan.reviews.push({ at, monthlyReady: plan.a.monthlyReady, margin: plan.available });
      state.actionPlan.reviews = state.actionPlan.reviews.slice(-52);
      state.monthlySnapshots = L.upsertMonthlySnapshot(state, new Date(at));
      state.actionPlan.reviewStep = null;
      finishPlanUpdate("Weekly review complete. This month’s snapshot is saved.");
    }
    const reopen = event.target.closest("[data-plan-reopen]");
    if (reopen && Object.prototype.hasOwnProperty.call(state.actionPlan.completed, reopen.dataset.planReopen)) {
      delete state.actionPlan.completed[reopen.dataset.planReopen];
      if (reopen.dataset.planReopen === "debts") state.actionPlan.noDebts = false;
      finishPlanUpdate("Step reopened. You can review it again.");
    }
  }

  function resetItemForm(form) {
    delete form.dataset.editId;
    form.reset();
    const expenses = form.id === "expenseForm";
    $("button[type=submit]", form).textContent = expenses ? "Add expense" : "Add debt";
    $("[data-cancel-edit]", form).hidden = true;
    $("summary", form.closest("details")).textContent = expenses ? "Add a monthly expense" : "Add a debt or obligation";
  }

  function editItem(collection, itemId) {
    const item = state[collection]?.find(item => item.id === itemId);
    if (!item || !["expenses", "debts"].includes(collection)) return;
    const form = $(collection === "expenses" ? "#expenseForm" : "#debtForm");
    form.reset();
    populateForm(form, item);
    if (collection === "expenses") {
      if (!Array.from(form.elements.category.options).some(o => o.value === item.category)) { form.elements.category.value = "Other"; form.elements.custom.value = item.category; }
      form.elements.recurring.checked = Boolean(item.recurring);
    } else {
      form.elements.required.checked = Boolean(item.required);
      form.elements.interestBearing.checked = Boolean(item.interestBearing);
    }
    form.dataset.editId = itemId;
    $("[data-cancel-edit]", form).hidden = false;
    $("summary", form.closest("details")).textContent = collection === "expenses" ? "Edit this expense" : "Edit this debt";
    $("button[type=submit]", form).textContent = collection === "expenses" ? "Save expense changes" : "Save debt changes";
    form.closest("details").open = true;
    form.scrollIntoView({ block: "center", behavior: "instant" });
    $("input", form)?.focus({ preventScroll: true });
  }

  function renderRoadmap() {
    const plan = P.build(state);
    const snapshots = state.monthlySnapshots.slice().reverse();
    const snapshotValue = value => value === null || value === undefined ? "Not recorded" : money(value);
    const history = snapshots.length ? `<div class="monthly-history-list" role="list" aria-label="Andrew's monthly financial snapshots">${snapshots.map(item => `<article class="monthly-history-row" role="listitem"><h3>${esc(L.periodLabel(item.month))}</h3><dl><div><dt>Income</dt><dd>${snapshotValue(item.income)}</dd></div><div><dt>Costs</dt><dd>${snapshotValue(item.costs)}</dd></div><div><dt>Difference</dt><dd class="${item.margin === null || item.margin === undefined ? "" : item.margin < 0 ? "negative" : "positive"}">${snapshotValue(item.margin)}</dd></div><div><dt>Checking</dt><dd>${snapshotValue(item.checking)}</dd></div><div><dt>Savings</dt><dd>${snapshotValue(item.savings)}</dd></div><div><dt>Debt</dt><dd>${snapshotValue(item.debt)}</dd></div></dl></article>`).join("")}</div>` : '<div class="empty-state">No monthly snapshots yet. Finish a weekly check-in to save the current month.</div>';
    $("#roadmapContent").innerHTML = `<article class="panel"><h2>${plan.completed} of ${plan.total} steps complete</h2><p>${plan.current ? `Andrew's next step: ${esc(plan.current.title)}.` : "Andrew's current plan steps are complete. Keep reviewing the numbers weekly."}</p><button class="button button-primary" data-nav-jump="plan">Continue Andrew's plan</button></article><article class="panel"><h2>Andrew's weekly check-ins</h2>${state.actionPlan.reviews.length ? `<ul>${state.actionPlan.reviews.slice().reverse().slice(0,8).map(r => `<li>${esc(new Date(r.at).toLocaleDateString())} — ${r.monthlyReady ? `${money(r.margin)} monthly margin` : "monthly picture still incomplete"}</li>`).join("")}</ul>` : "<p>No check-ins completed yet. Start one from Andrew's action plan.</p>"}</article><section class="panel monthly-history"><h2>Andrew's monthly snapshots</h2><p>Finishing a weekly check-in saves these six numbers. Another review in the same month updates that month instead of adding a duplicate.</p>${history}</section>`;
    $("#stageRoute").innerHTML = `<ol class="plan-progress-list">${plan.steps.map(step => `<li><span>${step.done ? "Complete" : step.status === "current" ? "Next" : "Later"}</span><strong>${esc(step.title)}</strong></li>`).join("")}</ol>`;
  }

  function generateReport(go = true) {
    state.generatedAt = new Date().toISOString(); save(); renderReport(L.analyze(state)); if (go) navigate("report"); notify("Andrew's financial plan generated.");
  }

  function renderReport(a) {
    const plan = P.build(state);
    $("#printReport").innerHTML = `<header><h1>Andrew's financial action plan</h1><p class="report-meta">Updated ${esc(new Date().toLocaleDateString())} · ${plan.completed} of ${plan.total} steps complete</p></header>
      <section><h2>Andrew's monthly picture</h2><p>Income: ${a.unknown.dependableIncome ? "Not entered" : money(a.income.dependable)}. Entered costs and debt payments: ${a.essentialKnown && a.debtMinimumsKnown ? money(a.expenses.total + a.plannedDebtMinimums) : "Not complete"}. Monthly difference: ${a.monthlyReady ? money(a.monthlySurplus) : "Not yet known"}.</p><p>These are estimates, not a statement of cash available to spend.</p></section>
      <section><h2>Andrew's next action</h2><p>${esc(plan.current?.title || "Keep Andrew's weekly check-in")}</p></section>
      ${plan.steps.map(step => `<section><h2>${step.number}. ${esc(step.title)} — ${step.done ? "Complete" : step.status === "current" ? "Next" : "Later"}</h2><p>${esc(step.why)}</p><ol>${step.instructions.map(i => `<li>${esc(i)}</li>`).join("")}</ol>${step.result ? `<p>${esc(step.result)}</p>` : ""}${planSavedNote(step.id) ? `<p>Your note: ${esc(planSavedNote(step.id))}</p>` : ""}</section>`).join("")}
      <section><h2>Weekly review</h2><p>Refresh checking, savings, overdue bills, and income. Review monthly costs and debt statements. Changed numbers may reopen earlier steps.</p></section>
      <footer><p>This is educational planning support. Milestones are planning defaults, not guarantees or individualized legal, tax, or investment advice. No money is moved by this app.</p>${P.SOURCES.map(source => `<p>${esc(source.title)}: ${esc(source.url)}</p>`).join("")}</footer>`;
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `andrews-financial-tracker-backup-${new Date().toISOString().slice(0,10)}.json`; a.hidden = true; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify("Andrew's Financial Tracker backup downloaded.");
  }
  async function importJson(event) {
    const file = event.target.files[0]; if (!file) return;
    try { const parsed = JSON.parse(await file.text()); state = L.normalize(parsed); resetItemForm($("#expenseForm")); resetItemForm($("#debtForm")); save(); populateForm($("#snapshotForm"), state.profile); populateForm($("#incomeForm"), state.income); populateQuickSetup(); renderAll(); notify("Backup restored successfully."); }
    catch { notify("That file could not be imported. Choose a valid Financial Reset JSON backup."); }
    event.target.value = "";
  }
  function showResetWarning() {
    $("#resetError").hidden = true;
    if (SAMPLE_MODE) {
      setText("#resetTitle", "Clear the sample data?");
      setText("#resetDescription", "This clears the fictional sample and any changes made during this visit. Andrew's real saved plan will not be deleted.");
      setText("#resetWarning", "The original fictional sample returns if you reload this sample page.");
      setText("#confirmResetButton", "Clear sample data");
    } else {
      setText("#resetTitle", "Delete all of Andrew's entered data?");
      setText("#resetDescription", cloud?.isSignedIn()
        ? "This permanently deletes Andrew's synced plan and the offline copy on this device. Other signed-in devices will receive the reset."
        : "This permanently deletes Andrew's income, expenses, debts, balances, notes, saved answers, action-plan progress, and check-in history from this browser.");
      setText("#resetWarning", cloud?.isSignedIn()
        ? "This cannot be undone. The deletion needs an internet connection. Download a backup first if you may need this plan later."
        : "This cannot be undone. Download a backup first if you may need your data later. Previously downloaded files are not deleted.");
      setText("#confirmResetButton", cloud?.isSignedIn() ? "Delete synced plan" : "Delete all data");
    }
    $("#resetDialog").showModal();
    $("#cancelResetButton").focus();
  }

  function clearEnteredData() {
    state = L.defaultState();
    // Clear unsaved form drafts and generated output as well as saved state.
    $$("form").forEach(form => form.reset());
    resetItemForm($("#expenseForm"));
    resetItemForm($("#debtForm"));
    populateForm($("#snapshotForm"), state.profile);
    populateForm($("#incomeForm"), state.income);
    populateQuickSetup();
    $$('[data-checkin]').forEach(input => input.checked = false);
    $$('input[name="debtStrategy"]').forEach(input => input.checked = input.value === state.settings.debtStrategy);
    $("#printReport").innerHTML = '<div class="empty-report"><h2>No plan generated yet</h2><p>Add Andrew\'s numbers, then generate a plan. Missing information will be clearly marked instead of guessed.</p></div>';
    $("#importInput").value = "";
    $("#resetDialog").close();
    $$(".data-menu, .nav-more, .planning-tools").forEach(details => details.open = false);
    navigate("setup");
    setText("#saveStatus", SAMPLE_MODE ? "Sample cleared · not saved" : "All data cleared");
  }

  async function resetData() {
    if (!$("#resetDialog").open) return;
    $("#confirmResetButton").disabled = true;
    setText("#resetError", "");
    try {
      if (!SAMPLE_MODE && cloud?.isSignedIn()) await cloud.resetRemote(L.defaultState());
      if (!SAMPLE_MODE) localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      setText("#resetError", error.message || "This device could not delete the synced plan. Nothing has been reset. Connect to the internet and try again.");
      $("#resetError").hidden = false;
      $("#confirmResetButton").disabled = false;
      return;
    }
    clearEnteredData();
    $("#confirmResetButton").disabled = false;
    notify(SAMPLE_MODE ? "Sample data cleared. Your saved plan is unchanged." : "All entered data deleted. You can start fresh.");
  }

  initialize();
})();
