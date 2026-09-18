const assert = require("node:assert/strict");
const L = require("./logic.js");
const P = require("./action-plan.js");

function ready() {
  const s = L.defaultState();
  Object.assign(s.income, { dependable: "3,200" });
  Object.assign(s.settings, { quickEssentialTotal: "2,000", quickDebtMinimums: "0" });
  Object.assign(s.profile, { checking: "500", unpaidRent: "0", overdueBills: "0" });
  return s;
}
const current = s => P.build(s).current?.id;
const done = (s, id) => P.build(s).steps.find(step => step.id === id).done;
function reviewed(s = ready()) {
  s = P.complete(s, "costs");
  return P.complete(s, "bills", "Keep money for groceries and rent.");
}
function starterDone() {
  const s = reviewed();
  s.profile.savings = "1,000";
  s.actionPlan.contribution = "100";
  return s;
}

// Every missing amount is requested separately. Explicit zero differs from unknown.
const empty = L.defaultState();
assert.equal(current(empty), "monthly");
assert.equal(P.build(empty).current.field.path, "income.dependable");
empty.income.dependable = "3,200";
assert.equal(P.build(empty).current.field.path, "settings.quickEssentialTotal");
empty.settings.quickEssentialTotal = "2,000";
assert.equal(P.build(empty).current.field.path, "settings.quickDebtMinimums");
empty.settings.quickDebtMinimums = "0";
assert.equal(current(empty), "overdue");
empty.profile.unpaidRent = "0";
assert.equal(P.build(empty).current.field.path, "profile.overdueBills");
empty.profile.overdueBills = "0";
assert.equal(current(empty), "checking");

// A complete path can be finished, saved, restored, and reopened when reality changes.
let s = reviewed();
assert.equal(current(s), "savings");
s.profile.savings = "0";
assert.equal(current(s), "contribution");
s.actionPlan.contribution = "100";
assert.equal(current(s), "starter");
assert.throws(() => P.complete(s, "starter"), /Balance milestones/);
s.actionPlan.completed.starter = { signature: "v1" };
assert.equal(current(s), "starter", "a forged checkbox cannot complete a savings milestone");
s.profile.savings = "1,000";
assert.equal(current(s), "debts");
s = P.complete(s, "debts");
assert.equal(current(s), "reserve");
assert.equal(done(s, "paydown"), true);
s.profile.savings = "6,000";
assert.equal(current(s), "future");
assert.throws(() => P.complete(s, "future", " "), /Add your next action/);
s = P.complete(s, "future", "Save for education; compare course costs this week.");
assert.equal(P.build(s).current, null);
assert.equal(P.build(s).completed, P.build(s).total);
assert.equal(P.build(L.normalize(JSON.parse(JSON.stringify(s)))) .current, null);
s.profile.savings = "600";
assert.equal(current(s), "starter", "a withdrawal reopens the cushion milestone");
s.profile.unpaidRent = "250";
assert.equal(current(s), "urgent", "new arrears take priority over recorded achievements");
assert.throws(() => P.complete(s, "future", "skip"), /current step/);
assert.throws(() => P.complete(s, "urgent"), /arrangement/);
s = P.complete(s, "urgent", "Call provider Tuesday; ask about an affordable arrangement.");
assert.equal(current(s), "current");
assert.equal(s.profile.unpaidRent, "250", "recording an arrangement never changes money");
s.profile.unpaidRent = "150";
assert.equal(current(s), "urgent", "a changed overdue amount prompts a fresh arrangement review");

// A shortfall and overdraft cannot be checked away.
let short = ready();
short.income.dependable = "1,500";
short = P.complete(short, "costs");
assert.equal(current(short), "gap");
assert.equal(P.build(short).available, -500);
assert.throws(() => P.complete(short, "gap"), /Balance milestones/);
short.income.dependable = "2,000";
short = P.complete(short, "costs");
assert.equal(current(short), "gap", "break-even does not imply affordable extra payments");
short.income.dependable = "2,500";
short = P.complete(short, "costs");
short.profile.checking = "-125";
assert.equal(current(short), "current");
short.profile.checking = "0";
assert.equal(current(short), "bills");

// The contribution must fit the remaining margin after irregular savings commitments.
let funds = reviewed();
funds.profile.savings = "0";
funds.sinkingFunds.push({ id: "repairs", monthly: "200" });
funds = P.complete(funds, "costs");
funds = P.complete(funds, "bills");
assert.equal(P.build(funds).available, 1000);
for (const bad of ["", "0", "-1", "1,001", "abc"]) {
  funds.actionPlan.contribution = bad;
  assert.equal(current(funds), "contribution");
}
funds.actionPlan.contribution = "1,000";
assert.equal(current(funds), "starter");

// A debt list is explicitly confirmed; missing numbers never mean debt-free.
let debts = starterDone();
debts.settings.quickDebtMinimums = "50";
debts = P.complete(debts, "costs");
debts = P.complete(debts, "bills");
assert.equal(current(debts), "debts");
assert.throws(() => P.complete(debts, "debts"), /debt details/);
debts.debts.push({ id: "card", name: "Card", balance: "900", minimum: "50", rate: "", required: false });
assert.equal(current(debts), "bills", "a new obligation prompts a fresh bill-timing review");
debts = P.complete(debts, "bills");
assert.equal(P.build(debts).current.inventoryReady, false);
assert.throws(() => P.complete(debts, "debts"), /debt details/);
debts.settings.debtStrategy = "snowball";
debts = P.complete(debts, "debts");
assert.equal(debts.settings.debtMinimumSource, "detailed");
debts = P.complete(debts, "costs");
debts = P.complete(debts, "bills");
assert.equal(current(debts), "paydown");
assert.equal(P.build(debts).current.field.path, "debt:card");
debts.debts[0].balance = "400";
assert.equal(current(debts), "paydown", "regular balance updates retain inventory confirmation");
debts.debts[0].balance = "0";
assert.equal(current(debts), "costs", "a paid-off minimum changes the monthly budget");
debts = P.complete(debts, "costs");
debts = P.complete(debts, "bills");
assert.equal(current(debts), "reserve");
debts.debts.push({ id: "court", name: "Court obligation", balance: "500", minimum: "100", rate: "0", required: true });
debts = P.complete(debts, "costs");
debts = P.complete(debts, "bills");
assert.equal(current(debts), "debts");
debts = P.complete(debts, "debts");
assert.equal(P.build(debts).current.field.path, "debt:court");
assert.match(P.build(debts).current.instructions[1], /protected obligation/);
debts.profile.upcomingMajorExpenses = "400";
assert.equal(current(debts), "bills", "new upcoming costs reopen the bill check");
debts = P.complete(debts, "bills");
debts.debts[1].dueDate = "12";
assert.equal(current(debts), "bills", "changed payment dates reopen the bill check");

// Genuine zero essential costs still leave a usable reserve floor and finishable plan.
let zero = ready();
zero.settings.quickEssentialTotal = "0";
zero = reviewed(zero);
zero.profile.savings = "1,000";
zero.actionPlan.contribution = "100";
zero = P.complete(zero, "debts");
assert.equal(current(zero), "future");
assert.equal(P.build(zero).steps.find(step => step.id === "reserve").progress.target, 1000);
assert.match(P.build(zero).steps.find(step => step.id === "reserve").why, /next checkpoint.*longer reserve target/i);

// Weekly review state, notes and drafts survive backup; seven days is the review cadence.
const review = ready();
review.actionPlan.lastReview = "2026-09-01T12:00:00.000Z";
review.actionPlan.reviewStep = 2;
review.actionPlan.reviewPaused = true;
review.actionPlan.drafts["note:gap"] = "Cancel unused subscription Friday.";
review.actionPlan.drafts["weekly:profile.unpaidRent"] = "250";
review.actionPlan.reviews.push({ at: review.actionPlan.lastReview, margin: 1200, monthlyReady: true });
const restored = L.normalize(JSON.parse(JSON.stringify(review)));
assert.deepEqual(restored.actionPlan, review.actionPlan);
assert.equal(P.build(restored, new Date("2026-09-07T12:00:00Z")).reviewDue, false);
assert.equal(P.build(restored, new Date("2026-09-08T12:00:00Z")).reviewDue, true);
assert.equal(P.build(restored, new Date("2026-08-31T12:00:00Z")).reviewDue, true);
assert.deepEqual(L.normalize({ income: { dependable: 1000 } }).actionPlan, L.defaultState().actionPlan);
const phases = P.build(ready()).steps.map(step => P.PHASES.indexOf(step.phase));
assert.deepEqual(phases, [...phases].sort(), "phase groups preserve step order");
console.log("Guided action-plan scenarios passed: full journey, regressions, debt, unknowns, and persistence.");
