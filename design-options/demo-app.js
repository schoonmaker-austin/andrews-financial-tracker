// Isolated copy of the current application for design comparison.
// Financial calculations use the unchanged ../logic.js. Refresh resets fictional data.
(function () {
  "use strict";
  const L = window.FinanceLogic;
  const STORAGE_KEY = "financial-reset-planner-v1";
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const money = amount => amount === "" || amount === null || amount === undefined || Number.isNaN(Number(amount)) ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Number(amount) % 1 ? 2 : 0 }).format(Number(amount));
  const esc = text => String(text ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  const id = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
  let state = load();
  let toastTimer;

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

  function load() { return L.normalize({"demo": true, "profile": {"checking": "840", "savings": "650", "cash": "0", "otherLiquid": "0", "nextPaycheckAmount": "1600", "unpaidRent": "0", "overdueBills": "0"}, "income": {"dependable": "3200", "average": "3500", "high": "4200", "received": "1600", "expected": "1600", "entries": []}, "settings": {"onboardingComplete": true}, "expenses": [{"id": "e0", "category": "Rent", "amount": "1250", "classification": "essential", "recurring": true}, {"id": "e1", "category": "Electricity", "amount": "160", "classification": "essential", "recurring": true}, {"id": "e2", "category": "Car insurance", "amount": "140", "classification": "essential", "recurring": true}, {"id": "e3", "category": "Basic groceries", "amount": "380", "classification": "essential", "recurring": true}, {"id": "e4", "category": "Fuel", "amount": "180", "classification": "essential", "recurring": true}, {"id": "e5", "category": "Phone", "amount": "60", "classification": "essential", "recurring": true}, {"id": "e6", "category": "Restaurants", "amount": "200", "classification": "discretionary", "recurring": true}, {"id": "e7", "category": "Entertainment", "amount": "90", "classification": "discretionary", "recurring": true}, {"id": "e8", "category": "Subscriptions", "amount": "40", "classification": "discretionary", "recurring": true}, {"id": "e9", "category": "Household goods", "amount": "85", "classification": "flexible", "recurring": true}], "debts": [{"id": "d1", "name": "Car loan", "creditor": "Credit union", "balance": "4200", "rate": "6.5", "minimum": "120", "type": "Auto", "required": true}], "sinkingFunds": [{"id": "f1", "name": "Car repairs", "monthly": "40"}]}); }
  function save(show = false) {
    state.updatedAt = new Date().toISOString();
    // Design previews are in-memory only: never write to saved financial data.
    $("#saveStatus").textContent = "Preview changes only · fictional data";
    if (show) notify("Preview updated. Your real data is unchanged.");
  }
  function notify(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }
  function formToObject(form) { return Object.fromEntries(new FormData(form).entries()); }
  function populateForm(form, data) { Object.entries(data).forEach(([key, val]) => { const input = form.elements[key]; if (input) input.value = val ?? ""; }); }
  function setText(selector, value) { const el = $(selector); if (el) el.textContent = value; }
  function valueKnown(raw) { return L.n(raw) !== null; }

  function navigate(view) {
    $$(".view").forEach(el => el.classList.toggle("is-active", el.dataset.view === view));
    $$("[data-nav]").forEach(el => {
      const active = el.dataset.nav === view;
      el.classList.toggle("is-active", active);
      if (active) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current");
    });
    const title = $(`[data-nav="${view}"]`)?.textContent.trim() || "Financial Reset Planner";
    setText("#pageTitle", title);
    $("#mobileNav").hidden = true;
    $("#mobileMenu").setAttribute("aria-expanded", "false");
    if (view === "setup") { populateQuickSetup(); showSetupStep(1); }
    window.scrollTo({ top: 0, behavior: "instant" });
    renderAll();
  }

  function hasFinancialData() {
    return Boolean(
      state.settings.onboardingComplete ||
      Object.values(state.profile).some(valueKnown) ||
      [state.income.dependable, state.income.average, state.income.received].some(valueKnown) ||
      state.expenses.length || state.debts.length
    );
  }

  function populateQuickSetup() {
    const form = $("#quickSetupForm");
    form.elements.dependable.value = state.income.dependable ?? "";
    form.elements.checking.value = state.profile.checking ?? "";
    form.elements.savings.value = state.profile.savings ?? "";
    form.elements.essentialTotal.value = state.settings.quickEssentialTotal ?? "";
    form.elements.debtMinimums.value = state.settings.quickDebtMinimums ?? "";
    const overdue = L.value(state.profile.unpaidRent) + L.value(state.profile.overdueBills);
    form.elements.overdueTotal.value = overdue || "";
  }

  function showSetupStep(step) {
    $$("[data-setup-step]").forEach(panel => {
      const active = Number(panel.dataset.setupStep) === step;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    setText("#setupStepLabel", `Step ${step} of 2`);
    $("#setupProgressBar").style.transform = `scaleX(${step / 2})`;
    const firstInput = $(`[data-setup-step="${step}"] input`);
    if (firstInput && !window.matchMedia("(max-width: 760px)").matches) firstInput.focus();
  }

  function saveQuickSetup(complete = false) {
    const values = formToObject($("#quickSetupForm"));
    state.income.dependable = values.dependable;
    state.profile.checking = values.checking;
    state.profile.savings = values.savings;
    state.profile.unpaidRent = "";
    state.profile.overdueBills = values.overdueTotal;
    state.settings.quickEssentialTotal = values.essentialTotal;
    state.settings.quickDebtMinimums = values.debtMinimums;
    if (complete) state.settings.onboardingComplete = true;
    save();
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
    if (state.demo) $("#saveStatus").textContent = "Sample plan: fictional data";
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
    $$(`input[name="debtStrategy"]`).forEach(input => input.checked = input.value === state.settings.debtStrategy);
    $("#rulesList").innerHTML = rules.map(rule => `<div class="rule">${esc(rule)}</div>`).join("");
    $("#checkinList").innerHTML = checkins.map((item, index) => `<label class="checkin-item"><input type="checkbox" data-checkin="${index}" ${state.checkin[index] ? "checked" : ""}><span>${esc(item)}</span></label>`).join("");
    $("#educationCards").innerHTML = education.map(([title, copy]) => `<article class="education-card"><h2>${esc(title)}</h2><p>${esc(copy)}</p></article>`).join("");
    setupEvents();
    renderAll();
    if (new URLSearchParams(location.search).get("report") === "1") generateReport(true);
    else if (!hasFinancialData()) navigate("setup");
  }

  function setupEvents() {
    $$("[data-nav]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.nav)));
    document.addEventListener("click", event => {
      const jump = event.target.closest("[data-nav-jump]"); if (jump) navigate(jump.dataset.navJump);
      const generate = event.target.closest("[data-generate]"); if (generate) generateReport();
      const remove = event.target.closest("[data-remove]"); if (remove) removeItem(remove.dataset.remove, remove.dataset.id);
    });
    $("#mobileMenu").addEventListener("click", () => {
      const menu = $("#mobileNav");
      const links = $(".mobile-nav-links", menu);
      if (!links.childElementCount) links.innerHTML = $(".nav-list").innerHTML;
      menu.hidden = !menu.hidden;
      $("#mobileMenu").setAttribute("aria-expanded", String(!menu.hidden));
      $$(`[data-nav]`, links).forEach(button => button.onclick = () => navigate(button.dataset.nav));
    });
    $("#mobileImportButton").addEventListener("click", () => $("#importInput").click());
    $("#mobileResetButton").addEventListener("click", resetData);
    $("#setupNext").addEventListener("click", () => { saveQuickSetup(); showSetupStep(2); });
    $("#setupBack").addEventListener("click", () => showSetupStep(1));
    $("#quickSetupForm").addEventListener("submit", event => {
      event.preventDefault();
      saveQuickSetup(true);
      populateForm($("#snapshotForm"), state.profile);
      populateForm($("#incomeForm"), state.income);
      renderAll();
      navigate("dashboard");
      notify("Your starting plan is ready. You can refine it anytime.");
    });
    $$(`[data-skip-setup]`).forEach(button => button.addEventListener("click", () => {
      state.settings.onboardingComplete = true;
      save();
      navigate("dashboard");
      notify("Setup skipped. Add any number whenever you are ready.");
    }));
    $("#snapshotForm").addEventListener("input", event => { state.profile[event.target.name] = event.target.value; save(); renderAll(); });
    $("#incomeForm").addEventListener("input", event => { state.income[event.target.name] = event.target.value; save(); renderAll(); });
    $("#incomeEntryForm").addEventListener("submit", event => { event.preventDefault(); const item = formToObject(event.target); state.income.entries.push({ id: id(), ...item }); event.target.reset(); save(); renderAll(); });
    $("#expenseCategory").addEventListener("change", event => { const option = event.target.selectedOptions[0]; $("#expenseForm").elements.classification.value = option.dataset.classification || "flexible"; });
    $("#expenseForm").addEventListener("submit", event => { event.preventDefault(); const item = formToObject(event.target); item.category = item.custom || item.category; item.recurring = event.target.elements.recurring.checked; delete item.custom; state.expenses.push({ id: id(), ...item }); event.target.reset(); event.target.elements.recurring.checked = true; save(); renderAll(); });
    $("#transactionForm").addEventListener("submit", event => { event.preventDefault(); state.transactions.push({ id: id(), ...formToObject(event.target) }); event.target.reset(); save(); renderAll(); });
    $("#debtForm").addEventListener("submit", event => { event.preventDefault(); const item = formToObject(event.target); item.required = event.target.elements.required.checked; item.interestBearing = event.target.elements.interestBearing.checked; state.debts.push({ id: id(), ...item }); event.target.reset(); save(); renderAll(); });
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
    $("#resetButton").addEventListener("click", resetData);
    $("#printButton").addEventListener("click", () => { if (!state.generatedAt) generateReport(false); window.print(); });
  }

  function removeItem(collection, itemId) {
    if (collection === "income") state.income.entries = state.income.entries.filter(item => item.id !== itemId);
    else state[collection] = state[collection].filter(item => item.id !== itemId);
    save(); renderAll();
  }

  function renderAll() {
    const a = L.analyze(state);
    renderDashboard(a); renderSnapshot(a); renderIncome(a); renderSpending(a); renderDebts(a); renderPlan(a); renderRoadmap(a);
    if (state.generatedAt) renderReport(a);
  }

  function renderDashboard(a) {
    const hasKnownSpending = state.expenses.some(item => valueKnown(item.amount)) || valueKnown(state.settings.quickEssentialTotal);
    const incomplete = a.unknown.expenses + (a.unknown.dependableIncome ? 1 : 0) + (hasKnownSpending ? 0 : 1);
    const unknownNotice = $("#dashboardUnknown");
    unknownNotice.hidden = incomplete === 0;
    unknownNotice.textContent = incomplete ? "This is a starting estimate using the numbers you entered. Skipped items do not stop the plan; adding them later will make it more exact." : "";
    $("#diagnosisPanel").classList.toggle("is-crisis", a.stage.id === 0);
    setText("#stageName", a.unknown.dependableIncome ? "Your starting point is saved" : a.stage.name);
    setText("#stageMessage", a.stage.id === 0 ? `Budgeting alone cannot completely solve a ${money(Math.abs(Math.min(0, a.monthlySurplus)))} monthly income deficit.` : a.stage.target);
    setText("#stageReason", a.unknown.dependableIncome ? "Add a cautious monthly income estimate when you can. Everything else you entered is already saved." : `Why: ${a.reason}.`);
    setText("#dashDependable", valueKnown(state.income.dependable) ? money(a.income.dependable) : "Unknown");
    setText("#dashSurvival", a.expenses.unknown ? `${money(a.survival)}+` : money(a.survival));
    setText("#dashSurplus", incomplete ? `About ${money(a.monthlySurplus)}` : money(a.monthlySurplus));
    $("#dashSurplus").className = a.monthlySurplus < 0 ? "negative" : "positive";
    setText("#milestoneName", a.stage.target);
    $("#milestoneProgress").style.transform = `scaleX(${a.progress / 100})`;
    setText("#previewMilestoneAmount", `${money(a.emergency)} / ${money(a.emergencyTarget)}`);
    setText("#milestoneCaption", `${money(a.emergency)} of ${money(a.emergencyTarget)} saved (${a.progress}%).`);
    const road = L.roadmap(a);
    $("#todayActions").innerHTML = road.now.map(item => `<li>${esc(item)}</li>`).join("");
    setText("#dashChecking", valueKnown(state.profile.checking) ? money(state.profile.checking) : "Unknown");
    setText("#dashEmergency", money(a.emergency));
    setText("#dashSpending", money(a.expenses.total + a.plannedDebtMinimums));
    setText("#dashSafe", incomplete ? `About ${money(a.safeToSpend)}` : money(a.safeToSpend));
  }

  function renderSnapshot(a) {
    const days = date => { if (!date) return "Unknown"; return Math.ceil((new Date(`${date}T12:00:00`) - new Date()) / 86400000); };
    $("#snapshotSummary").innerHTML = `<div><span>Total liquid cash</span><strong>${money(a.liquid)}</strong></div><div><span>Cash after immediate obligations</span><strong class="${a.availableAfterImmediate < 0 ? "negative" : ""}">${money(a.availableAfterImmediate)}</strong></div><div><span>Days until rent / paycheck</span><strong>${days(state.profile.rentDueDate)} / ${days(state.profile.nextPaycheckDate)}</strong></div>`;
  }

  function renderIncome(a) {
    $("#incomeEntries").innerHTML = state.income.entries.length ? state.income.entries.map(item => `<div class="data-row"><div class="row-main"><strong>${esc(item.type)}</strong><small>${esc(item.date || "No date")} · ${esc(item.status)}</small></div><span class="amount">${money(item.amount)}</span><span></span><span></span><button class="button button-quiet button-small row-actions" data-remove="income" data-id="${item.id}">Remove</button></div>`).join("") : `<div class="empty-state">Optional: add individual paychecks, piecework, overtime, or side jobs here.</div>`;
  }

  function renderSpending(a) {
    const quickTotal = state.settings.quickEssentialTotal;
    const detailedEssentials = state.expenses.some(item => item.classification === "essential" && valueKnown(item.amount));
    const baselineNotice = $("#spendingBaselineNotice");
    baselineNotice.hidden = !valueKnown(quickTotal);
    baselineNotice.textContent = detailedEssentials
      ? `Your detailed essential categories now replace the ${money(quickTotal)} rough estimate from Quick setup, so it is not counted twice.`
      : `Your ${money(quickTotal)} rough essential-cost estimate from Quick setup is active. Adding detailed essential categories will replace it, not add to it.`;
    $("#expenseList").innerHTML = state.expenses.length ? state.expenses.map(item => `<div class="data-row"><div class="row-main"><strong>${esc(item.category)}</strong><small>${esc(item.classification)}${item.dueDate ? ` · due day ${esc(item.dueDate)}` : ""}${item.notes ? ` · ${esc(item.notes)}` : ""}</small></div><span class="amount">${valueKnown(item.amount) ? money(item.amount) : "Unknown"}</span><span>${item.recurring ? "Recurring" : "One-time"}</span><span></span><button class="button button-quiet button-small row-actions" data-remove="expenses" data-id="${item.id}">Remove</button></div>`).join("") : `<div class="empty-state">Add monthly expenses to calculate survival cost, weekly limits, and cash flow.</div>`;
    $("#transactionList").innerHTML = state.transactions.length ? state.transactions.map(item => `<div class="data-row"><div class="row-main"><strong>${esc(item.name)}</strong><small>${esc(item.category)} · ${esc(item.classification)} · ${esc(item.date || "No date")}</small></div><span class="amount">${money(item.amount)}</span><span></span><span></span><button class="button button-quiet button-small row-actions" data-remove="transactions" data-id="${item.id}">Remove</button></div>`).join("") : `<div class="empty-state">Add transactions manually for a more accurate spending audit.</div>`;
    const income = a.income.dependable;
    const pct = amount => income ? `${L.round(amount / income * 100)}%` : "—";
    const restaurantTarget = Math.min(250, a.spending.restaurants);
    const restaurantFree = Math.max(0, a.spending.restaurants - restaurantTarget);
    $("#auditContent").innerHTML = `
      <div class="metrics-grid"><div class="metric"><span>Total spending</span><strong>${money(a.spending.total)}</strong></div><div class="metric"><span>Essential</span><strong>${money(a.spending.essential)}</strong></div><div class="metric"><span>Discretionary</span><strong>${money(a.spending.discretionary)}</strong></div><div class="metric"><span>Savings rate</span><strong>${a.savingsRate === null ? "—" : `${a.savingsRate}%`}</strong></div></div>
      <div class="plan-grid"><article class="panel"><h2>Share of dependable income</h2><div class="allocation-list"><div class="allocation-row"><span>Housing</span><strong>${a.percentages ? `${a.percentages.housing}%` : "—"}</strong></div><div class="allocation-row"><span>Transportation</span><strong>${a.percentages ? `${a.percentages.transportation}%` : "—"}</strong></div><div class="allocation-row"><span>Food</span><strong>${a.percentages ? `${a.percentages.food}%` : "—"}</strong></div><div class="allocation-row"><span>Debt minimums</span><strong>${a.percentages ? `${a.percentages.debt}%` : "—"}</strong></div><div class="allocation-row"><span>Discretionary</span><strong>${pct(a.spending.discretionary)}</strong></div></div></article>
      <article class="panel"><h2>Possible room to create</h2><p>You currently spend approximately <strong>${money(a.spending.restaurants)}/month</strong> eating away from home.</p><p>${restaurantFree > 0 ? `Reducing this to ${money(restaurantTarget)} would free approximately <strong>${money(restaurantFree)}/month</strong>, or <strong>${money(restaurantFree * 12)}/year</strong>.` : "This category is already at or below the comparison target of $250."}</p><p>Dates and entertainment: <strong>${money(a.spending.social)}/month</strong>. Subscriptions: <strong>${money(a.spending.subscriptions)}/month</strong>.</p></article></div>`;
  }

  function renderDebts(a) {
    const order = L.debtOrder(state, state.settings.debtStrategy);
    $("#debtSummary").innerHTML = `<div class="metrics-grid"><div class="metric"><span>Total debt</span><strong>${money(a.debts.total)}</strong></div><div class="metric"><span>Monthly minimums</span><strong>${money(a.debts.minimums)}</strong></div><div class="metric"><span>Weighted average rate</span><strong>${a.debts.weightedRate}%</strong></div><div class="metric"><span>Current target</span><strong>${esc(order.primary?.name || "None")}</strong></div></div>${order.protected.length ? `<div class="notice notice-warning">Protected regardless of strategy: ${order.protected.map(item => esc(item.name)).join(", ")}.</div>` : ""}`;
    const ranks = new Map(order.targets.map((item, index) => [item.id, index + 1]));
    $("#debtList").innerHTML = state.debts.length ? state.debts.map(item => `<div class="data-row"><div class="row-main"><strong>${esc(item.name)}</strong><small>${esc(item.type)} · ${esc(item.creditor || "No creditor entered")}${item.required ? " · protected obligation" : ranks.has(item.id) ? ` · target #${ranks.get(item.id)}` : ""}</small></div><span class="amount">${money(item.balance)}</span><span>${L.value(item.rate)}% APR</span><span>${money(item.minimum)}/mo</span><button class="button button-quiet button-small row-actions" data-remove="debts" data-id="${item.id}">Remove</button></div>`).join("") : `<div class="empty-state">No debts entered. That is different from a confirmed $0 balance. Add any dental, legal, family, auto, or other obligation.</div>`;
  }

  function renderPlan(a) {
    $("#survivalMode").innerHTML = a.stage.id === 0 ? `<div class="notice notice-danger"><strong>Financial Survival Mode</strong><br>Dependable income: ${money(a.income.dependable)} · Survival expenses: ${money(a.survival)} · Monthly shortfall: ${money(a.monthlySurplus)}.<br>Budgeting alone cannot completely solve this deficit. Expenses must fall, income must rise, or both.</div>` : "";
    $("#emergencyPlan").innerHTML = `<p>This cash prevents a tire, tow, copay, or minor repair from immediately creating a new crisis.</p><div class="progress-track"><span style="width:${a.progress}%"></span></div><div class="allocation-row"><span>Saved now</span><strong>${money(a.emergency)}</strong></div><div class="allocation-row"><span>Current milestone</span><strong>${money(a.emergencyTarget)}</strong></div>`;
    const weekly = L.weeklyLimits(state);
    $("#weeklyPlan").innerHTML = weekly.length ? `<div class="allocation-list">${weekly.map(item => `<div class="allocation-row"><span>${esc(item.name)}</span><strong>${money(item.amount)}/week</strong></div>`).join("")}<div class="allocation-row"><span><strong>Weekly flexible spending limit</strong></span><strong>${money(L.sum(weekly.map(item => item.amount)))}</strong></div></div>` : `<div class="empty-state">Add flexible and discretionary monthly expenses to create weekly limits.</div>`;
    const paycheck = L.paycheckPlan(state);
    $("#paycheckPlan").innerHTML = paycheck.paycheck ? `<div class="allocation-list"><div class="allocation-row"><span><strong>Paycheck received</strong></span><strong>${money(paycheck.paycheck)}</strong></div>${paycheck.rows.map(row => `<div class="allocation-row"><span>${esc(row.label)}</span><strong>${money(row.amount)}</strong></div>`).join("")}<div class="allocation-row"><span>Remaining</span><strong>${money(paycheck.remaining)}</strong></div></div>` : `<div class="empty-state">Enter the next paycheck amount in Current Situation to calculate an allocation.</div>`;
    const rule = L.extraRule(a.stage.id);
    $("#extraRule").innerHTML = `<p>When income exceeds the dependable baseline:</p><div class="allocation-list"><div class="allocation-row"><span>${rule.labels[0]}</span><strong>${rule.recovery}%</strong></div><div class="allocation-row"><span>${rule.labels[1]}</span><strong>${rule.upcoming}%</strong></div><div class="allocation-row"><span>${rule.labels[2]}</span><strong>${rule.discretionary}%</strong></div></div>`;
    $("#sinkingList").innerHTML = state.sinkingFunds.length ? state.sinkingFunds.map(item => `<div class="data-row"><div class="row-main"><strong>${esc(item.name)}</strong><small>${money(L.value(item.monthly) * 12)} available after one year</small></div><span class="amount">${money(item.monthly)}/mo</span><span></span><span></span><button class="button button-quiet button-small row-actions" data-remove="sinkingFunds" data-id="${item.id}">Remove</button></div>`).join("") : `<div class="empty-state">Example: $40/month toward car maintenance becomes $480/year for repairs.</div>`;
  }

  function renderRoadmap(a) {
    const road = L.roadmap(a);
    const cards = [["First 7 days", road.now], ["First 30 days", road.day30], ["By day 60", road.day60], ["By day 90", road.day90]];
    $("#roadmapContent").innerHTML = cards.map(([title, items]) => `<article class="roadmap-card"><h2>${title}</h2><ul>${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul></article>`).join("");
    $("#stageRoute").innerHTML = L.STAGES.map(stage => `<div class="stage-stop ${stage.id < a.stage.id ? "is-complete" : stage.id === a.stage.id ? "is-current" : ""}">${esc(stage.short)}</div>`).join("");
  }

  function generateReport(go = true) {
    state.generatedAt = new Date().toISOString(); save(); renderReport(L.analyze(state)); if (go) navigate("report"); notify("Financial reset plan generated.");
  }

  function renderReport(a) {
    const road = L.roadmap(a); const order = L.debtOrder(state, state.settings.debtStrategy); const weekly = L.weeklyLimits(state); const rule = L.extraRule(a.stage.id);
    const hasKnownSpending = state.expenses.some(item => valueKnown(item.amount)) || valueKnown(state.settings.quickEssentialTotal);
    const incomplete = a.unknown.expenses + (a.unknown.dependableIncome ? 1 : 0) + (hasKnownSpending ? 0 : 1);
    const list = items => `<ul>${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>`;
    $("#printReport").innerHTML = `<header><h1>Financial Reset Plan</h1><p class="report-meta">Generated ${new Date(state.generatedAt).toLocaleString()} · All figures stay on this device</p></header>
      ${incomplete ? `<div class="notice notice-warning">This is a starting estimate using known numbers. Skipped items can be added later without blocking the plan.</div>` : ""}
      <div class="report-summary"><div><span>Current stage</span><strong>${esc(a.stage.short)}</strong></div><div><span>Dependable income</span><strong>${valueKnown(state.income.dependable) ? money(a.income.dependable) : "Unknown"}</strong></div><div><span>Required spending</span><strong>${money(a.survival)}</strong></div><div><span>Monthly result</span><strong class="${a.monthlySurplus < 0 ? "negative" : "positive"}">${incomplete ? `About ${money(a.monthlySurplus)}` : money(a.monthlySurplus)}</strong></div></div>
      <section><h2>Current situation</h2><p><strong>${esc(a.stage.name)}.</strong> ${esc(a.reason)}. Liquid cash is ${money(a.liquid)}; ${money(a.availableAfterImmediate)} remains after entered immediate obligations.</p></section>
      <section><h2>Immediate priorities</h2>${list(road.now)}</section>
      <section><h2>Income and monthly spending</h2><p>The plan uses dependable income of ${valueKnown(state.income.dependable) ? money(a.income.dependable) : "an unknown amount"}. Average expected income is ${money(a.income.average)} and projected current-month income is ${money(a.income.projected)}.</p><p>Known essential spending: ${money(a.expenses.essential)}. Flexible spending: ${money(a.expenses.flexible)}. Discretionary spending: ${money(a.expenses.discretionary)}.</p></section>
      <section><h2>Emergency fund strategy</h2><p>You currently have ${money(a.emergency)} in entered emergency savings. The current milestone is ${money(a.emergencyTarget)}. Build this before treating optional debt payments or investing as higher priorities.</p></section>
      <section><h2>Weekly spending limits</h2>${weekly.length ? list(weekly.map(item => `${item.name}: ${money(item.amount)}/week`)) : "<p>Add flexible expenses to calculate weekly limits.</p>"}</section>
      <section><h2>Debt strategy</h2><p>Selected method: <strong>${state.settings.debtStrategy === "avalanche" ? "Debt avalanche" : "Debt snowball"}</strong>. Required or legally sensitive payments remain protected. ${order.primary ? `The current extra-payment target is ${esc(order.primary.name)} with a balance of ${money(order.primary.balance)}.` : "No active debt target is entered."}</p></section>
      <section><h2>Extra income rule</h2><p>Above the dependable baseline: ${rule.recovery}% to ${esc(rule.labels[0])}, ${rule.upcoming}% to ${esc(rule.labels[1])}, and ${rule.discretionary}% to ${esc(rule.labels[2])}.</p></section>
      <section><h2>Sinking fund targets</h2>${state.sinkingFunds.length ? list(state.sinkingFunds.map(item => `${item.name}: ${money(item.monthly)}/month (${money(L.value(item.monthly) * 12)}/year)`)) : "<p>No sinking funds entered yet. Start with car repairs, tires, dental, or work tools.</p>"}</section>
      <section><h2>30 / 60 / 90-day objectives</h2><h3>First 30 days</h3>${list(road.day30)}<h3>By day 60</h3>${list(road.day60)}<h3>By day 90</h3>${list(road.day90)}</section>
      <section><h2>Long-term roadmap</h2><p>Stabilize cash flow → build a starter emergency fund → clean up debt → hold one month of required expenses → build a 3–6 month emergency fund → increase retirement and long-term investing.</p></section>
      <section><h2>Financial rules</h2>${list(rules)}</section>
      <section><h2>10-minute weekly money check-in</h2>${list(checkins)}<p><strong>Final question:</strong> Am I financially better off than I was seven days ago?</p></section>
      <footer><p><strong>Important:</strong> This plan is educational and does not replace individualized legal, tax, or investment advice.</p></footer>`;
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `financial-reset-backup-${new Date().toISOString().slice(0,10)}.json`; a.hidden = true; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify("JSON backup exported.");
  }
  async function importJson(event) {
    const file = event.target.files[0]; if (!file) return;
    try { const parsed = JSON.parse(await file.text()); state = L.normalize(parsed); save(); populateForm($("#snapshotForm"), state.profile); populateForm($("#incomeForm"), state.income); populateQuickSetup(); renderAll(); notify("Backup restored successfully."); }
    catch { notify("That file could not be imported. Choose a valid Financial Reset JSON backup."); }
    event.target.value = "";
  }
  function resetData() {
    if (!confirm("Clear the fictional data in this preview? Your saved tracker is unaffected.")) return;
    state = L.defaultState(); /* Preview reset only. */ populateForm($("#snapshotForm"), state.profile); populateForm($("#incomeForm"), state.income); populateQuickSetup(); renderAll(); navigate("setup"); notify("Preview cleared. Your saved tracker is unaffected.");
  }

  initialize();
})();
