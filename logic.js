(function (root) {
  "use strict";

  const STAGES = [
    { id: 0, name: "Financial Survival Mode", short: "Crisis", target: "Cover housing and critical obligations" },
    { id: 1, name: "Stabilization", short: "Stabilize", target: "Build a $250 cash buffer" },
    { id: 2, name: "Starter Emergency Fund", short: "Starter fund", target: "Build a $1,000 emergency fund" },
    { id: 3, name: "Debt Cleanup", short: "Debt cleanup", target: "Pay down the target debt" },
    { id: 4, name: "One-Month Buffer", short: "One-month buffer", target: "Hold one month of required expenses" },
    { id: 5, name: "Full Emergency Fund", short: "Full emergency fund", target: "Hold 3–6 months of essentials" },
    { id: 6, name: "Investing & Wealth Building", short: "Build wealth", target: "Increase long-term investing" }
  ];

  function signedNumber(input) {
    if (typeof input === "number") return Number.isFinite(input) ? input : null;
    if (input === null || input === undefined || typeof input === "boolean") return null;
    const text = String(input).trim().replace(/^\$\s*/, "");
    if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{0,2})?$/.test(text)) return null;
    const amount = Number(text.replace(/,/g, ""));
    return Number.isFinite(amount) ? amount : null;
  }
  const n = input => { const amount = signedNumber(input); return amount === null || amount < 0 ? null : amount; };
  const value = input => n(input) ?? 0;
  const signedValue = input => signedNumber(input) ?? 0;
  const sum = items => items.reduce((total, item) => total + value(item), 0);
  const known = items => items.filter(item => n(item) !== null);
  const round = amount => {
    const numeric = Number(amount) || 0;
    return Math.round((numeric + Number.EPSILON) * 100) / 100;
  };
  const monthlyToWeekly = amount => round(value(amount) / 4.33);
  const periodKey = input => {
    if (input instanceof Date && Number.isFinite(input.getTime())) {
      return `${input.getFullYear()}-${String(input.getMonth() + 1).padStart(2, "0")}`;
    }
    const match = String(input || "").match(/^(\d{4})-(0[1-9]|1[0-2])(?:-|$)/);
    return match ? `${match[1]}-${match[2]}` : null;
  };
  const currentPeriod = (now = new Date()) => periodKey(now);
  const periodLabel = period => {
    const key = periodKey(period);
    if (!key) return "Selected month";
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1, 12));
  };

  function defaultState() {
    return {
      version: 1,
      updatedAt: null,
      profile: {
        checking: "", savings: "", cash: "", otherLiquid: "",
        nextPaycheckDate: "", nextPaycheckAmount: "", rentDueDate: "",
        unpaidRent: "", overdueBills: "", upcomingMajorExpenses: ""
      },
      income: { dependable: "", average: "", high: "", received: "", expected: "", entries: [] },
      expenses: [],
      transactions: [],
      debts: [],
      sinkingFunds: [],
      settings: {
        onboardingComplete: false,
        setupStarted: false,
        setupStep: 1,
        quickEssentialTotal: "",
        quickDebtMinimums: "",
        trackingPeriod: currentPeriod(),
        essentialSource: "estimate",
        debtMinimumSource: "estimate",
        debtStrategy: "avalanche",
        extraRule: { recovery: 70, upcoming: 20, discretionary: 10 }
      },
      checkin: {},
      monthlySnapshots: [],
      actionPlan: { completed: {}, drafts: {}, contribution: "", noDebts: false, lastReview: null, reviews: [] },
      generatedAt: null
    };
  }

  function normalize(raw) {
    const base = defaultState();
    const state = raw && typeof raw === "object" ? raw : {};
    return {
      ...base,
      ...state,
      profile: { ...base.profile, ...(state.profile || {}) },
      income: { ...base.income, ...(state.income || {}), entries: Array.isArray(state.income?.entries) ? state.income.entries : [] },
      expenses: Array.isArray(state.expenses) ? state.expenses : [],
      transactions: Array.isArray(state.transactions) ? state.transactions : [],
      debts: Array.isArray(state.debts) ? state.debts : [],
      sinkingFunds: Array.isArray(state.sinkingFunds) ? state.sinkingFunds : [],
      settings: { ...base.settings,
        // Preserve the totals used by older saved plans; new plans keep estimates until confirmed.
        essentialSource: state.settings?.essentialSource || (state.expenses?.some?.(e => e.classification === "essential" && n(e.amount) !== null) ? "detailed" : "estimate"),
        debtMinimumSource: state.settings?.debtMinimumSource || (state.debts?.some?.(d => value(d.balance) > 0) ? "detailed" : "estimate"),
        ...(state.settings || {}),
        trackingPeriod: periodKey(state.settings?.trackingPeriod) || base.settings.trackingPeriod,
        extraRule: { ...base.settings.extraRule, ...(state.settings?.extraRule || {}) } },
      checkin: { ...(state.checkin || {}) },
      monthlySnapshots: Array.isArray(state.monthlySnapshots)
        ? state.monthlySnapshots.filter(item => item && periodKey(item.month)).slice(-24)
        : [],
      actionPlan: { ...base.actionPlan, ...(state.actionPlan || {}), completed: { ...(state.actionPlan?.completed || {}) }, drafts: { ...(state.actionPlan?.drafts || {}) }, reviews: Array.isArray(state.actionPlan?.reviews) ? state.actionPlan.reviews : [] }
    };
  }

  function expenseTotals(state) {
    const totals = { essential: 0, flexible: 0, discretionary: 0, unknown: 0, total: 0 };
    state.expenses.forEach(expense => {
      const amount = n(expense.amount);
      if (amount === null) totals.unknown += 1;
      else {
        const type = ["essential", "flexible", "discretionary"].includes(expense.classification) ? expense.classification : "flexible";
        totals[type] += amount;
        totals.total += amount;
      }
    });
    const quickEssential = n(state.settings.quickEssentialTotal);
    totals.detailedEssential = totals.essential;
    totals.usingEstimate = state.settings.essentialSource !== "detailed" && quickEssential !== null;
    if (totals.usingEstimate) {
      totals.total += quickEssential - totals.essential;
      totals.essential = quickEssential;
      totals.unknown -= state.expenses.filter(e => e.classification === "essential" && n(e.amount) === null).length;
    }
    return totals;
  }

  function debtTotals(state) {
    const active = state.debts.filter(debt => value(debt.balance) > 0);
    const total = sum(active.map(debt => debt.balance));
    const minimums = sum(active.map(debt => debt.minimum));
    const requiredMinimums = sum(active.filter(debt => debt.required).map(debt => debt.minimum));
    const weightedRate = total > 0
      ? round(active.reduce((acc, debt) => acc + value(debt.balance) * value(debt.rate), 0) / total)
      : 0;
    return { active, total, minimums, requiredMinimums, weightedRate };
  }

  function incomeTotals(state, period) {
    const entries = state.income.entries || [];
    const periodEntries = entries.filter(entry => periodKey(entry.date) === period);
    const receivedEntries = sum(periodEntries.filter(entry => entry.status === "received").map(entry => entry.amount));
    const expectedEntries = sum(periodEntries.filter(entry => entry.status !== "received").map(entry => entry.amount));
    const received = entries.length ? receivedEntries : value(state.income.received);
    const expected = entries.length ? expectedEntries : value(state.income.expected);
    return {
      dependable: value(state.income.dependable),
      average: value(state.income.average),
      high: value(state.income.high),
      received,
      expected,
      projected: received + expected,
      period,
      periodLabel: periodLabel(period),
      periodEntries,
      undatedEntries: entries.filter(entry => !periodKey(entry.date)).length
    };
  }

  function audit(state, expenses, period) {
    const periodTransactions = state.transactions.filter(item => periodKey(item.date) === period);
    const usesTransactions = periodTransactions.length > 0;
    const source = usesTransactions ? periodTransactions : state.expenses;
    const amountOf = item => value(item.amount);
    const classify = item => item.classification || "flexible";
    const category = item => String(item.category || item.name || "Other").toLowerCase();
    const total = usesTransactions ? sum(source.map(amountOf)) : expenses.total;
    const byClass = { essential: 0, flexible: 0, discretionary: 0 };
    const byCategory = {};
    source.forEach(item => {
      const amount = amountOf(item);
      const type = classify(item);
      byClass[type] = (byClass[type] || 0) + amount;
      const key = category(item);
      byCategory[key] = (byCategory[key] || 0) + amount;
    });
    if (!usesTransactions) {
      byClass.essential = expenses.essential;
      byClass.flexible = expenses.flexible;
      byClass.discretionary = expenses.discretionary;
    }
    const find = words => Object.entries(byCategory).reduce((acc, [key, amount]) => words.some(word => key.includes(word)) ? acc + amount : acc, 0);
    return {
      source: usesTransactions ? `${periodLabel(period)} transactions` : "monthly estimates",
      period,
      periodLabel: periodLabel(period),
      transactionCount: periodTransactions.length,
      undatedTransactions: state.transactions.filter(item => !periodKey(item.date)).length,
      total,
      byClass,
      byCategory,
      restaurants: find(["restaurant", "fast food", "coffee"]),
      social: find(["date", "entertain", "bar", "movie"]),
      subscriptions: find(["subscription", "streaming"]),
      essential: usesTransactions ? byClass.essential : expenses.essential,
      discretionary: usesTransactions ? byClass.discretionary : expenses.discretionary
    };
  }

  function analyze(rawState) {
    const state = normalize(rawState);
    const period = state.settings.trackingPeriod;
    const expenses = expenseTotals(state);
    const debts = debtTotals(state);
    const income = incomeTotals(state, period);
    const profile = state.profile;
    const liquidInputs = [profile.checking, profile.savings, profile.cash, profile.otherLiquid];
    const liquid = liquidInputs.reduce((total, item) => total + signedValue(item), 0);
    const emergency = Math.max(0, signedValue(profile.savings) + signedValue(profile.otherLiquid));
    const immediate = value(profile.unpaidRent) + value(profile.overdueBills) + value(profile.upcomingMajorExpenses);
    const availableAfterImmediate = liquid - immediate;
    const hasDebtExpense = !expenses.usingEstimate && state.expenses.some(expense => String(expense.category).toLowerCase().includes("minimum required debt") && n(expense.amount) !== null);
    const quickDebtMinimums = value(state.settings.quickDebtMinimums);
    const usingDebtEstimate = state.settings.debtMinimumSource !== "detailed" && n(state.settings.quickDebtMinimums) !== null;
    const plannedDebtMinimums = hasDebtExpense ? Math.max(0, debts.minimums - debts.requiredMinimums) : usingDebtEstimate ? quickDebtMinimums : debts.minimums;
    const survivalDebtMinimums = hasDebtExpense ? 0 : usingDebtEstimate ? quickDebtMinimums : debts.requiredMinimums;
    const survival = expenses.essential + survivalDebtMinimums;
    const monthlySurplus = income.dependable - expenses.total - plannedDebtMinimums;
    const unknown = {
      liquid: liquidInputs.filter(item => signedNumber(item) === null).length,
      expenses: expenses.unknown,
      dependableIncome: n(state.income.dependable) === null
    };
    const essentialKnown = expenses.usingEstimate || state.settings.essentialSource === "detailed";
    const debtMinimumsKnown = hasDebtExpense || usingDebtEstimate || (state.settings.debtMinimumSource === "detailed" && debts.active.every(d => n(d.minimum) !== null));
    const missingMonthly = [];
    if (unknown.dependableIncome) missingMonthly.push("income");
    if (!essentialKnown || expenses.unknown) missingMonthly.push("costs");
    if (!debtMinimumsKnown) missingMonthly.push("debt payments");
    const monthlyReady = missingMonthly.length === 0;
    const savingsKnown = n(profile.savings) !== null || n(profile.otherLiquid) !== null;
    const stageReady = monthlyReady && signedNumber(profile.checking) !== null && savingsKnown && (n(profile.unpaidRent) !== null || n(profile.overdueBills) !== null);

    let stageId;
    const crisisReasons = [];
    if (value(profile.unpaidRent) > 0) crisisReasons.push("rent is currently unpaid");
    if (value(profile.overdueBills) > 0) crisisReasons.push("required bills are overdue");
    if (!unknown.dependableIncome && income.dependable < survival) crisisReasons.push("dependable income is below survival expenses");
    if (availableAfterImmediate < 0) crisisReasons.push("immediate obligations exceed available cash");
    if (crisisReasons.length) stageId = 0;
    else if (liquid < 250 || monthlySurplus <= 0) stageId = 1;
    else if (emergency < 1000) stageId = 2;
    else if (debts.total > 0) stageId = 3;
    else if (emergency < survival) stageId = 4;
    else if (emergency < survival * 3) stageId = 5;
    else stageId = 6;

    const stage = STAGES[stageId];
    const reason = stageId === 0 ? crisisReasons.join("; ") : [
      "cash flow is fragile and the first buffer is not secure",
      "basic obligations appear covered, but emergency savings are below $1,000",
      "the starter fund exists and remaining debt can now be targeted",
      "problematic debt is handled; the next goal is one month of required expenses",
      "the one-month buffer exists; build a full 3–6 month reserve",
      "core reserves and debt are handled; long-term investing can increase"
    ][stageId - 1];
    const reserveTarget = Math.max(1000, round(expenses.essential * 3));
    const emergencyTarget = emergency < 250 ? 250 : emergency < 500 ? 500 : stageId <= 2 ? 1000 : Math.max(1000, stageId === 4 ? survival : reserveTarget);
    const progress = emergencyTarget > 0 ? Math.min(100, round((emergency / emergencyTarget) * 100)) : 0;
    const spending = audit(state, expenses, period);
    const safeToSpend = Math.max(0, round(monthlySurplus - sum(state.sinkingFunds.map(fund => fund.monthly))));
    const savingsRate = income.dependable > 0 ? round((Math.max(0, monthlySurplus) / income.dependable) * 100) : null;
    const percentages = income.dependable > 0 ? {
      housing: round((sum(state.expenses.filter(e => String(e.category).toLowerCase().includes("rent")).map(e => e.amount)) / income.dependable) * 100),
      transportation: round((sum(state.expenses.filter(e => /car|fuel|auto|transport/i.test(e.category)).map(e => e.amount)) / income.dependable) * 100),
      food: round((sum(state.expenses.filter(e => /grocer|restaurant|fast food|coffee/i.test(e.category)).map(e => e.amount)) / income.dependable) * 100),
      debt: round((debts.minimums / income.dependable) * 100),
      discretionary: round((expenses.discretionary / income.dependable) * 100),
      savings: savingsRate
    } : null;

    return { state, period, periodLabel: periodLabel(period), expenses, debts, plannedDebtMinimums, usingDebtEstimate, essentialKnown, debtMinimumsKnown, missingMonthly, monthlyReady, savingsKnown, stageReady, income, liquid, emergency, immediate, availableAfterImmediate, survival, monthlySurplus, unknown, stage, reason, emergencyTarget, reserveTarget, progress, spending, safeToSpend, savingsRate, percentages };
  }

  function createMonthlySnapshot(rawState, at = new Date()) {
    const state = normalize(rawState);
    const analysis = analyze(state);
    const costsKnown = analysis.essentialKnown && analysis.debtMinimumsKnown && analysis.expenses.unknown === 0;
    const debtKnown = state.debts.length
      ? state.debts.every(debt => n(debt.balance) !== null)
      : state.actionPlan.noDebts === true;
    return {
      month: currentPeriod(at),
      capturedAt: at.toISOString(),
      income: analysis.unknown.dependableIncome ? null : analysis.income.dependable,
      costs: costsKnown ? round(analysis.expenses.total + analysis.plannedDebtMinimums) : null,
      margin: analysis.monthlyReady ? analysis.monthlySurplus : null,
      checking: signedNumber(state.profile.checking),
      savings: analysis.savingsKnown ? analysis.emergency : null,
      debt: debtKnown ? analysis.debts.total : null
    };
  }

  function upsertMonthlySnapshot(rawState, at = new Date()) {
    const state = normalize(rawState);
    const snapshot = createMonthlySnapshot(state, at);
    return state.monthlySnapshots
      .filter(item => item.month !== snapshot.month)
      .concat(snapshot)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-24);
  }

  function debtOrder(state, strategy) {
    const debts = debtTotals(normalize(state)).active;
    const required = debts.filter(debt => debt.required);
    const targets = debts.filter(debt => !debt.required);
    targets.sort(strategy === "snowball"
      ? (a, b) => value(a.balance) - value(b.balance)
      : (a, b) => value(b.rate) - value(a.rate) || value(a.balance) - value(b.balance));
    return { protected: required, targets, primary: targets[0] || required[0] || null };
  }

  function weeklyLimits(state) {
    return normalize(state).expenses
      .filter(expense => expense.classification !== "essential" && n(expense.amount) !== null)
      .map(expense => ({ name: expense.category || "Other", amount: monthlyToWeekly(expense.amount), classification: expense.classification }))
      .sort((a, b) => b.amount - a.amount);
  }

  function extraRule(stageId) {
    if (stageId === 0) return { recovery: 70, upcoming: 20, discretionary: 10, labels: ["immediate shortfall / overdue obligations", "emergency buffer", "discretionary"] };
    if (stageId <= 2) return { recovery: 70, upcoming: 20, discretionary: 10, labels: ["emergency fund", "sinking funds", "discretionary"] };
    if (stageId === 3) return { recovery: 70, upcoming: 20, discretionary: 10, labels: ["target debt", "emergency / sinking funds", "discretionary"] };
    return { recovery: 50, upcoming: 30, discretionary: 20, labels: ["long-term goal", "upcoming expenses", "discretionary"] };
  }

  function paycheckPlan(rawState) {
    const analysis = analyze(rawState);
    let remaining = value(analysis.state.profile.nextPaycheckAmount);
    const rows = [];
    const allocate = (label, wanted) => {
      const amount = Math.min(remaining, Math.max(0, round(wanted)));
      if (amount > 0) rows.push({ label, amount });
      remaining = round(remaining - amount);
    };
    allocate("Unpaid rent", analysis.state.profile.unpaidRent);
    allocate("Overdue required bills", analysis.state.profile.overdueBills);
    const allocatedExpenseIds = new Set();
    const dueSoon = analysis.state.expenses.filter(expense => expense.dueDate && expense.classification === "essential").sort((a, b) => Number(a.dueDate) - Number(b.dueDate));
    dueSoon.forEach(expense => {
      allocate(expense.category, value(expense.amount));
      allocatedExpenseIds.add(expense.id);
    });
    const grocery = analysis.state.expenses.find(expense => /grocer/i.test(expense.category));
    const fuel = analysis.state.expenses.find(expense => /fuel/i.test(expense.category));
    if (grocery && !allocatedExpenseIds.has(grocery.id)) allocate("Groceries", monthlyToWeekly(grocery.amount));
    if (fuel && !allocatedExpenseIds.has(fuel.id)) allocate("Fuel", monthlyToWeekly(fuel.amount));
    const debtMinimumExpense = analysis.state.expenses.some(expense => /minimum required debt/i.test(expense.category));
    if (!debtMinimumExpense) {
      analysis.debts.active
        .filter(debt => debt.required)
        .forEach(debt => allocate(`${debt.name || "Required obligation"} minimum`, value(debt.minimum)));
    }
    if (remaining > 0 && analysis.stage.id > 0) allocate("Emergency fund", Math.min(remaining, Math.max(25, remaining * 0.2)));
    if (remaining > 0) allocate("Discretionary money", Math.min(remaining, remaining * 0.1));
    return { paycheck: value(analysis.state.profile.nextPaycheckAmount), rows, remaining };
  }

  function roadmap(analysis) {
    const needsProtection = analysis.stage.id === 0;
    const debt = analysis.debts.total > 0;
    return {
      now: needsProtection
        ? ["Protect rent and critical bills", "Pause unplanned discretionary spending", "Find a way to close the monthly income gap"]
        : ["Confirm every required bill", "Set the weekly spending limit", "Move the first dollars to the next milestone"],
      day30: ["Track every discretionary purchase", analysis.emergency < 250 ? "Build the first $250 cash buffer" : "Keep the starter buffer intact", "Bring mandatory obligations current"],
      day60: [analysis.emergency < 1000 ? "Work toward the $1,000 emergency fund" : "Protect the $1,000 starter fund", debt ? "Begin the targeted debt payoff" : "Build the one-month buffer", "Fund predictable irregular expenses"],
      day90: ["Run the monthly plan consistently", debt ? "Reduce the target debt balance" : "Increase the cash buffer", "Review progress and update the dependable-income baseline"]
    };
  }

  const api = { STAGES, n, signedNumber, value, signedValue, sum, round, monthlyToWeekly, periodKey, currentPeriod, periodLabel, defaultState, normalize, analyze, createMonthlySnapshot, upsertMonthlySnapshot, debtOrder, weeklyLimits, extraRule, paycheckPlan, roadmap };
  root.FinanceLogic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
