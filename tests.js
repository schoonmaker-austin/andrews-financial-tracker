const assert = require("assert");
const L = require("./logic.js");

function state(overrides = {}) {
  const base = L.defaultState();
  return L.normalize({ ...base, ...overrides, profile: { ...base.profile, ...(overrides.profile || {}) }, income: { ...base.income, ...(overrides.income || {}) } });
}
const expense = (category, amount, classification = "essential") => ({ id: category, category, amount, classification });
const debt = (name, balance, rate, minimum, required = false) => ({ id: name, name, balance, rate, minimum, required });

const crisis = state({
  profile: { checking: 100, unpaidRent: 400, overdueBills: 150 }, income: { dependable: 2450 },
  expenses: [expense("Rent", 1350), expense("Utilities", 250), expense("Fuel", 200), expense("Groceries", 500), expense("Insurance", 350)]
});
assert.equal(L.analyze(crisis).stage.id, 0, "negative cash flow and unpaid rent should be crisis");
assert.equal(L.analyze(crisis).monthlySurplus, -200);

const starter = state({ profile: { checking: 500, savings: 200 }, income: { dependable: 3500 }, expenses: [expense("Rent", 1350), expense("Other essentials", 1300)] });
assert.equal(L.analyze(starter).stage.id, 2, "positive cash flow under $1,000 savings should build starter fund");

const withDebt = state({ profile: { checking: 900, savings: 1000 }, income: { dependable: 4200 }, expenses: [expense("Essentials", 2600)], debts: [debt("Dental", 2200, 8, 100), debt("Card", 900, 24, 45)] });
assert.equal(L.analyze(withDebt).stage.id, 3);
assert.equal(L.debtOrder(withDebt, "avalanche").primary.name, "Card");
assert.equal(L.debtOrder(withDebt, "snowball").primary.name, "Card");

const stable = state({ profile: { checking: 3000, savings: 20000 }, income: { dependable: 5000 }, expenses: [expense("Essentials", 2500)] });
assert.equal(L.analyze(stable).stage.id, 6, "three-plus months of essentials and no debt should permit wealth building");

const missing = state({ income: { dependable: "" }, expenses: [expense("Rent", "")] });
assert.equal(L.analyze(missing).unknown.expenses, 1);
assert.equal(L.analyze(missing).unknown.dependableIncome, true);

const required = state({ profile: { checking: 1000, savings: 1000 }, income: { dependable: 4000 }, expenses: [expense("Essentials", 2200)], debts: [debt("Court", 600, 0, 100, true), debt("Dental", 1200, 12, 75)] });
assert.equal(L.debtOrder(required, "avalanche").protected[0].name, "Court");
assert.equal(L.debtOrder(required, "avalanche").primary.name, "Dental");

const crisisWithSurplus = state({ profile: { checking: 500, unpaidRent: 100 }, income: { dependable: 4000 }, expenses: [expense("Rent", 1200)] });
assert.equal(L.analyze(crisisWithSurplus).stage.id, 0);
assert.equal(L.roadmap(L.analyze(crisisWithSurplus)).now[0], "Protect rent and critical bills", "crisis actions should follow the diagnosis, even with a monthly surplus");

const overdrafted = state({ profile: { checking: -125, savings: 50, cash: 25 }, income: { dependable: 2000 }, expenses: [expense("Rent", 1000)] });
assert.equal(L.analyze(overdrafted).liquid, -50, "negative liquid balances must remain negative");

const allocation = state({
  profile: { nextPaycheckAmount: 1000 },
  income: { dependable: 3000 },
  expenses: [
    { ...expense("Basic groceries", 400), id: "groceries", dueDate: "2" },
    { ...expense("Fuel", 200), id: "fuel" }
  ],
  debts: [debt("Court", 600, 0, 100, true)]
});
const paycheckRows = L.paycheckPlan(allocation).rows;
assert.equal(paycheckRows.filter(row => row.label === "Basic groceries").length, 1, "a due grocery expense should not be allocated twice");
assert.equal(paycheckRows.some(row => row.label === "Court minimum" && row.amount === 100), true, "required debt minimums must be protected before savings");

const quickSetup = state({
  income: { dependable: 4000 },
  settings: { quickEssentialTotal: 2500, quickDebtMinimums: 200 }
});
assert.equal(L.analyze(quickSetup).survival, 2700, "quick setup should protect the rough essential total and debt minimums");
assert.equal(L.analyze(quickSetup).monthlySurplus, 1300, "quick setup should produce a usable monthly estimate without detailed bills");
assert.equal(L.analyze(quickSetup).spending.total, 2500, "the spending summary should include the quick essential estimate");

const detailedReplacesEstimate = state({
  income: { dependable: 4000 },
  settings: { quickEssentialTotal: 2500, essentialSource: "detailed" },
  expenses: [expense("Detailed essentials", 2200)]
});
assert.equal(L.analyze(detailedReplacesEstimate).expenses.essential, 2200, "detailed essential entries should replace, not double-count, the quick estimate");

const gradualBills = state({ income: { dependable: "3,200" }, settings: { quickEssentialTotal: "2,500", quickDebtMinimums: "150", essentialSource: "estimate", debtMinimumSource: "estimate" }, expenses: [expense("Rent", 1400)] });
assert.equal(L.analyze(gradualBills).monthlySurplus, 550, "a first bill must not replace the whole estimate");
assert.equal(L.analyze(gradualBills).monthlyReady, true);
gradualBills.settings.essentialSource = "detailed";
assert.equal(L.analyze(gradualBills).monthlySurplus, 1650, "only an explicit switch should replace the estimate");

const gradualDebts = state({ income: { dependable: 3200 }, settings: { quickEssentialTotal: 2500, quickDebtMinimums: 300, essentialSource: "estimate", debtMinimumSource: "estimate" }, debts: [debt("First card", 500, 20, 50)] });
assert.equal(L.analyze(gradualDebts).monthlySurplus, 400, "a first debt must not replace total minimums");
gradualDebts.settings.debtMinimumSource = "detailed";
assert.equal(L.analyze(gradualDebts).monthlySurplus, 650);

for (const text of ["3,200", "$3,200", " 3200 ", "3,200.00"]) assert.equal(L.n(text), 3200);
for (const text of ["", " ", "3,20", "abc", "Infinity", "1e3", "1,2,3", "-10"]) assert.equal(L.n(text), null);
assert.equal(L.signedNumber("-125.50"), -125.5);
assert.equal(L.n("0"), 0);
assert.equal(L.n(0.1 + 0.2), 0.1 + 0.2, "computed numbers must not be parsed as text");

const incomeOnly = L.analyze(state({ income: { dependable: 3200 }, profile: { checking: 450, savings: 1500 } }));
assert.equal(incomeOnly.monthlyReady, false, "income alone cannot establish money remaining");
assert.equal(incomeOnly.stageReady, false, "incomplete costs cannot establish a recovery stage");
assert.deepEqual(incomeOnly.missingMonthly, ["costs", "debt payments"]);
assert.equal(L.analyze(L.defaultState()).monthlyReady, false);
const unfinishedBills = state({ income: { dependable: 3200 }, settings: { essentialSource: "estimate", quickDebtMinimums: 0 }, expenses: [expense("First bill only", 1400)] });
assert.equal(L.analyze(unfinishedBills).monthlyReady, false, "an unconfirmed first bill cannot stand in for missing total costs");
unfinishedBills.settings.essentialSource = "detailed";
assert.equal(L.analyze(unfinishedBills).monthlyReady, true, "the user can explicitly confirm a complete bill list");
assert.equal(L.analyze(state({ income: { dependable: 3200 }, settings: { quickEssentialTotal: 2500, quickDebtMinimums: 0 } })).monthlyReady, true, "known zero minimums are distinct from missing minimums");

const legacy = L.normalize({ income: { dependable: 4000 }, settings: { quickEssentialTotal: 2500 }, expenses: [expense("Rent", 1400)] });
assert.equal(legacy.settings.essentialSource, "detailed", "existing saved plans retain their chosen totals");
assert.equal(L.analyze(legacy).expenses.essential, 1400);

const periodAware = state({
  income: { dependable: 4000, entries: [
    { id: "apr-pay", amount: 1800, status: "received", date: "2026-04-15" },
    { id: "sep-pay", amount: 2100, status: "received", date: "2026-09-15" },
    { id: "sep-next", amount: 900, status: "expected", date: "2026-09-28" },
    { id: "undated-pay", amount: 500, status: "received", date: "" }
  ] },
  settings: { trackingPeriod: "2026-09", quickEssentialTotal: 2500, quickDebtMinimums: 0 },
  transactions: [
    { id: "apr-food", category: "Restaurants", classification: "discretionary", amount: 400, date: "2026-04-10" },
    { id: "sep-food", category: "Restaurants", classification: "discretionary", amount: 120, date: "2026-09-10" },
    { id: "sep-rent", category: "Rent", classification: "essential", amount: 1400, date: "2026-09-01" },
    { id: "undated", category: "Subscriptions", classification: "discretionary", amount: 99, date: "" }
  ]
});
let periodAnalysis = L.analyze(periodAware);
assert.equal(periodAnalysis.income.received, 2100, "income entries should use only the selected month");
assert.equal(periodAnalysis.income.expected, 900);
assert.equal(periodAnalysis.income.undatedEntries, 1);
assert.equal(periodAnalysis.spending.total, 1520, "transactions from other months must not inflate the selected month");
assert.equal(periodAnalysis.spending.restaurants, 120);
assert.equal(periodAnalysis.spending.undatedTransactions, 1);
periodAware.settings.trackingPeriod = "2026-04";
periodAnalysis = L.analyze(periodAware);
assert.equal(periodAnalysis.income.received, 1800);
assert.equal(periodAnalysis.spending.total, 400);

const snapshotState = state({
  profile: { checking: 450, savings: 1000 },
  income: { dependable: 4000 },
  settings: { quickEssentialTotal: 2500, quickDebtMinimums: 0 },
  actionPlan: { noDebts: true }
});
snapshotState.monthlySnapshots = L.upsertMonthlySnapshot(snapshotState, new Date("2026-08-20T12:00:00Z"));
snapshotState.profile.savings = 1250;
snapshotState.monthlySnapshots = L.upsertMonthlySnapshot(snapshotState, new Date("2026-08-27T12:00:00Z"));
assert.equal(snapshotState.monthlySnapshots.length, 1, "a later review in the same month should update the snapshot");
assert.equal(snapshotState.monthlySnapshots[0].savings, 1250);
snapshotState.monthlySnapshots = L.upsertMonthlySnapshot(snapshotState, new Date("2026-09-20T12:00:00Z"));
assert.deepEqual(snapshotState.monthlySnapshots.map(item => item.month), ["2026-08", "2026-09"]);
assert.equal(snapshotState.monthlySnapshots[1].income, 4000);
assert.equal(snapshotState.monthlySnapshots[1].costs, 2500);
assert.equal(snapshotState.monthlySnapshots[1].margin, 1500);
assert.equal(snapshotState.monthlySnapshots[1].debt, 0);

console.log("All financial logic scenarios passed, including period and monthly-history regressions.");
