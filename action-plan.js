(function (root) {
  "use strict";
  const L = root.FinanceLogic || (typeof require === "function" ? require("./logic.js") : null);
  const money = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
  const signature = values => JSON.stringify(values);
  const PHASES = ["Know where you stand", "Get the month under control", "Build your cushion", "Reduce debt and move forward"];
  const SOURCES = [
    { title: "CFPB: choosing which bills to prioritize", url: "https://files.consumerfinance.gov/f/documents/cfpb_your-money-your-goals_prioritizing-bills_tool.pdf" },
    { title: "CFPB: building an emergency fund", url: "https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/" },
    { title: "CFPB: choosing a debt repayment method", url: "https://files.consumerfinance.gov/f/documents/cfpb_your-money-your-goals_debt-action-plan_tool_2018-11.pdf" }
  ];
  const REVIEW_FIELDS = [
    { path: "profile.checking", label: "What is your checking balance today?", hint: "Use the balance your bank shows. A negative balance is allowed.", signed: true },
    { path: "profile.savings", label: "What is your emergency savings balance today?", hint: "Enter the balance in savings, not a new deposit. Other liquid savings already entered remain separate." },
    { path: "profile.unpaidRent", label: "How much rent or mortgage is overdue today?", hint: "Use 0 if none. Leave future payments out of this amount." },
    { path: "profile.overdueBills", label: "How much is overdue on other required bills?", hint: "Do not include rent again. Use 0 if none." },
    { path: "income.dependable", label: "What monthly take-home income can you count on now?", hint: "Use a cautious amount when pay varies." }
  ];

  function build(raw, now = new Date()) {
    const state = L.normalize(raw), a = L.analyze(state), p = state.actionPlan;
    const steps = [];
    const monthlySig = signature([a.income.dependable, a.expenses.total, a.plannedDebtMinimums, state.settings.essentialSource, state.settings.debtMinimumSource, state.expenses.map(e => [e.id, e.amount, e.classification]), state.sinkingFunds.map(f => [f.id, f.monthly])]);
    const overdueKnown = L.n(state.profile.unpaidRent) !== null && L.n(state.profile.overdueBills) !== null;
    const overdue = L.value(state.profile.unpaidRent) + L.value(state.profile.overdueBills);
    const available = L.round(a.monthlySurplus - L.sum(state.sinkingFunds.map(f => f.monthly)));
    const cashKnown = L.signedNumber(state.profile.checking) !== null;
    const cashNegative = cashKnown && L.signedNumber(state.profile.checking) < 0;
    const debtSig = signature(state.debts.map(d => [d.id, d.name, d.rate, d.minimum, d.required, d.type]));
    const debtRowsComplete = state.debts.every(d => L.n(d.balance) !== null && L.n(d.minimum) !== null && (state.settings.debtStrategy !== "avalanche" || L.n(d.rate) !== null));
    const debtInventoryConfirmed = state.debts.length > 0
      ? debtRowsComplete && p.completed.debts?.signature === debtSig
      : p.noDebts === true && a.plannedDebtMinimums === 0;
    const monthlyField = a.unknown.dependableIncome
      ? { path: "income.dependable", label: "Andrew's monthly take-home income", hint: "Use a cautious monthly amount after taxes." }
      : a.missingMonthly.includes("costs")
        ? { path: "settings.quickEssentialTotal", label: "Andrew's essential monthly costs", hint: "Include housing, groceries, transport, utilities, and insurance. Debt payments come next." }
        : { path: "settings.quickDebtMinimums", label: "Andrew's minimum debt payments each month", hint: "Enter 0 if none. Leave out payments already included in essential costs." };
    const add = step => {
      step.phase = PHASES[step.phase];
      step.done = Boolean(step.done);
      step.signature = step.signature || "v1";
      if (step.kind === "review") step.done = Boolean(step.ready && p.completed[step.id]?.signature === step.signature);
      steps.push(step);
      return step;
    };
    add({ id: "monthly", phase: 0, title: "Complete Andrew's monthly picture", kind: "data", done: a.monthlyReady,
      why: "A useful plan starts with income and costs. Missing figures stay unknown.",
      instructions: ["Enter a cautious take-home income, essential costs, and minimum debt payments.", "Use estimates if needed. Each answer is saved before the next question."], field: monthlyField,
      result: a.monthlyReady ? `${money(a.income.dependable)} income minus ${money(a.expenses.total + a.plannedDebtMinimums)} entered costs = ${money(a.monthlySurplus)} per month.` : `Still needed: ${a.missingMonthly.join(", ")}.`, links: [{ view: "setup", label: "Review Andrew's monthly numbers" }] });
    add({ id: "overdue", phase: 0, title: "Check for overdue essentials", kind: "data", done: overdueKnown,
      why: "Overdue housing and required bills need attention before optional savings or extra debt payments.",
      instructions: ["Check your statements for amounts already overdue.", "Enter housing first, then other required bills. Enter 0 when none are overdue."],
      field: L.n(state.profile.unpaidRent) === null
        ? { path: "profile.unpaidRent", label: "Rent or mortgage already overdue", hint: "Exclude future payments. Enter 0 if none." }
        : { path: "profile.overdueBills", label: "Other required bills already overdue", hint: "Do not count housing twice. Enter 0 if none." },
      result: overdueKnown ? `${money(overdue)} in entered overdue essentials.` : "Overdue amounts have not both been confirmed." });
    add({ id: "urgent", phase: 1, title: overdue > 0 ? `Make a plan for ${money(overdue)} overdue` : "Address overdue bills", kind: overdue > 0 ? "review" : "data", done: overdueKnown && overdue === 0, ready: overdueKnown,
      signature: signature([state.profile.unpaidRent, state.profile.overdueBills]),
      why: "The consequences of missing a payment matter more than which creditor calls most often.",
      instructions: ["Identify the bills that protect housing, work, essential insurance, and court-ordered obligations.", "If you cannot pay, contact the provider about an arrangement. Record the amount, agreed date, and your next follow-up below.", "Only mark this conversation step done after you have made a plan. The balance stays overdue until you update it."],
      noteRequired: true, noteLabel: "Your arrangement or next follow-up", completeLabel: "I’ve made an overdue-bill plan", source: 0 });
    add({ id: "checking", phase: 1, title: "Check the cash you can use today", kind: "data", done: cashKnown,
      why: "A positive monthly estimate does not mean that cash is available today.",
      instructions: ["Check the current balance in your everyday checking account.", "Keep upcoming bills in mind before moving money elsewhere."],
      field: { path: "profile.checking", label: "Checking balance today", hint: "Use the balance your bank shows, including a minus sign if overdrawn.", signed: true }, result: cashKnown ? `${money(L.signedNumber(state.profile.checking))} in checking.` : "Checking balance not entered." });
    add({ id: "costs", phase: 1, title: "Check that your month includes every cost", kind: "review", ready: a.monthlyReady, signature: monthlySig,
      why: "Unlisted costs can make the amount left over look larger than it is.",
      instructions: [`Review your ${money(a.expenses.total + a.plannedDebtMinimums)} entered monthly costs against recent statements.`, "Include optional spending and irregular costs, not just bills. Check that loan and card payments are counted once.", "Add or adjust anything missing, then confirm that this is a usable estimate for the month."],
      completeLabel: "I’ve checked my monthly costs", links: [{ view: "spending", label: "Review or edit spending" }, { view: "setup", label: "Change my rough totals" }] });
    add({ id: "gap", phase: 1, title: a.monthlyReady && available <= 0 ? `Create room in your monthly budget` : "Keep income ahead of planned costs", kind: "outcome", done: a.monthlyReady && available > 0,
      why: a.monthlyReady ? `${available < 0 ? `Your entered costs and planned savings exceed income by ${money(-available)} a month.` : available === 0 ? "Every entered dollar is already committed." : `Your entered monthly margin is ${money(available)}.`}` : "The gap can be calculated once the monthly picture is complete.",
      instructions: ["Choose one optional cost to reduce or one realistic way to increase dependable income. Write down the specific change below.", a.expenses.discretionary > 0 ? `You have ${money(a.expenses.discretionary)} in entered optional spending to review. Any remaining gap needs other changes; do not assume every cost can be cut.` : "If optional cuts are not enough, contact bill providers about affordable arrangements and look into additional dependable income or assistance.", "Update the actual monthly totals after the change. Planned savings from a change are not counted until those totals change."],
      noteLabel: "The change you’ll make and when", links: [{ view: "spending", label: "Change a monthly expense" }, { view: "setup", label: "Update income or rough costs" }], result: a.monthlyReady ? `Monthly margin after entered costs and planned savings: ${money(available)}.` : "Monthly margin not known." });
    add({ id: "current", phase: 1, title: "Bring overdue essentials and checking up to date", kind: "outcome", done: overdueKnown && overdue === 0 && cashKnown && !cashNegative,
      why: "Making a payment arrangement is progress. It does not mean the overdue balance has disappeared.",
      instructions: ["Follow the payment arrangement you recorded. Revisit the provider if the amount or date is no longer workable.", "After a payment clears, update the real overdue balance. Do not enter a payment as income.", "Use your current checking balance; do not promise money that is still expected."],
      field: L.value(state.profile.unpaidRent) > 0 ? { path: "profile.unpaidRent", label: "Housing amount still overdue", hint: "Enter the remaining balance after confirmed payments, or 0 when current." }
        : L.value(state.profile.overdueBills) > 0 ? { path: "profile.overdueBills", label: "Other required bills still overdue", hint: "Enter the remaining balance, or 0 when current." }
          : { path: "profile.checking", label: "Updated checking balance", signed: true, hint: "Enter the actual balance, not the amount deposited." },
      result: `${money(overdue)} entered overdue${cashKnown ? `; ${money(L.signedNumber(state.profile.checking))} in checking` : ""}.` });
    add({ id: "bills", phase: 1, title: "Protect the bills due before your next income", kind: "review", ready: a.monthlyReady && cashKnown && overdueKnown && overdue === 0 && !cashNegative,
      signature: signature([monthlySig, state.profile.checking, state.profile.nextPaycheckDate, state.profile.nextPaycheckAmount, state.profile.upcomingMajorExpenses, state.expenses.map(e => [e.id, e.dueDate]), state.debts.map(d => [d.id, d.dueDate]), overdue]),
      why: "Income and bills arrive on different dates. Monthly room is not a transfer recommendation.",
      instructions: ["Open your bank account and list the payments due before your next dependable income arrives.", "Include groceries, travel to work, required obligations, and minimum payments on every debt.", "Set that money aside in your own budget. Confirm you know what must remain in checking before choosing an extra amount."],
      noteLabel: "Bills or dates you want to remember", completeLabel: "I’ve protected my upcoming bills", links: [{ view: "snapshot", label: "Add paycheck and bill dates" }], source: 0 });
    add({ id: "savings", phase: 2, title: "Record your emergency savings", kind: "data", done: a.savingsKnown,
      why: "Use money actually saved, not what you hope to put aside.", instructions: ["Check the balance reserved for unexpected expenses.", "Enter 0 if you are starting from nothing. That is a valid starting point."],
      field: { path: "profile.savings", label: "Emergency savings balance", hint: "Enter the total balance in savings. Other liquid savings already entered remain separate." }, result: a.savingsKnown ? `${money(a.emergency)} in entered emergency savings.` : "Savings balance not entered.", source: 1 });
    const contribution = L.n(p.contribution);
    const contributionValid = contribution !== null && contribution > 0 && a.monthlyReady && contribution <= available;
    add({ id: "contribution", phase: 2, title: "Choose an affordable monthly amount for progress", kind: "data", done: contributionValid,
      why: a.monthlyReady ? `Your entered monthly margin is ${money(Math.max(0, available))}. Choose an amount within that estimate after checking bill timing.` : "Finish the monthly picture before choosing an amount.",
      instructions: ["Choose a monthly amount you can sustain for savings or extra debt payments. A small amount is fine.", "This amount is used for one goal at a time. Your regular minimum debt payments are already included in your monthly costs.", "If you cannot afford anything yet, return to the monthly gap step and review the costs. No transfer is made here."],
      field: { path: "actionPlan.contribution", label: "Monthly amount toward your next goal", hint: "Only choose money left after necessities and upcoming bills.", positive: true, max: Math.max(0, available) } });
    const starterTarget = 1000;
    const nextMilestone = a.emergency < 250 ? 250 : a.emergency < 500 ? 500 : starterTarget;
    const months = target => contributionValid ? Math.ceil(Math.max(0, target - a.emergency) / contribution) : null;
    add({ id: "starter", phase: 2, title: "Build your starter emergency cushion", kind: "outcome", done: a.savingsKnown && a.emergency >= starterTarget,
      why: "A small reserve helps you handle an unexpected expense without immediately adding debt.",
      instructions: [`Work toward ${money(nextMilestone)} first. Andrew's Financial Tracker uses $250, $500, then $1,000 as starter milestones, not a universal savings requirement.`, contributionValid ? `Your chosen pace is ${money(contribution)} per month. Only set it aside when the cash is available after required bills.` : "Choose an affordable monthly amount first.", "Update your actual savings balance after it changes. The app never moves money or assumes a transfer happened."],
      field: { path: "profile.savings", label: "Updated emergency savings balance", hint: "Enter the total now in savings, not just this month’s contribution." }, progress: { current: a.emergency, target: starterTarget },
      result: a.savingsKnown ? `${money(Math.max(0, starterTarget - a.emergency))} to the starter target${months(starterTarget) !== null ? `; about ${months(starterTarget)} months at your chosen pace, assuming no withdrawals` : ""}.` : "Savings balance is still unknown.", source: 1 });
    add({ id: "debts", phase: 3, title: "Confirm Andrew's debts and choose an order", kind: "inventory", done: debtInventoryConfirmed, signature: debtSig,
      why: "A missing debt or unknown interest rate can change which balance should be targeted.",
      instructions: ["Add every debt with its current balance and minimum payment. Mark obligations that need special protection.", "Highest interest first generally reduces interest costs; smallest balance first gives earlier payoffs. Choose the approach you can maintain.", "Before confirming, include every minimum payment. This confirmation switches the monthly plan to the listed debt minimums."],
      inventoryReady: state.debts.length > 0 && debtRowsComplete, canConfirmNone: state.debts.length === 0 && a.plannedDebtMinimums === 0,
      result: state.debts.length ? `${state.debts.length} debt records; ${money(a.debts.total)} in entered active balances.${!debtRowsComplete ? " Add missing balances, minimums, and interest rates (or choose smallest balance first)." : ""}` : "No debt list has been confirmed. An empty list does not automatically mean debt-free.",
      links: [{ view: "debts", label: "Add, edit, or order Andrew's debts" }], source: 2 });
    const order = L.debtOrder(state, state.settings.debtStrategy);
    const targetDebt = order.targets[0] || order.protected[0];
    add({ id: "paydown", phase: 3, title: targetDebt ? `Work down ${targetDebt.name || "your next debt"}` : "Pay down your remaining debts", kind: "outcome", done: debtInventoryConfirmed && a.debts.total === 0,
      why: "Keep required payments current on every debt while concentrating any affordable extra amount.",
      instructions: [targetDebt ? `${targetDebt.name || "This debt"} has an entered balance of ${money(L.value(targetDebt.balance))} and minimum payment of ${money(L.value(targetDebt.minimum))}.` : "Confirm your debt list first.", targetDebt?.required ? "This is a protected obligation. Follow its required terms; check with the provider before changing payment arrangements." : contributionValid ? `After minimums and essential bills, up to your chosen ${money(contribution)} monthly amount can go toward this target when cash is available.` : "Choose an affordable extra amount only after required payments are covered.", "When your statement changes, update the balance below. Interest and fees mean we do not infer a payoff date or subtract a payment automatically."],
      field: targetDebt ? { path: `debt:${targetDebt.id}`, label: `Updated balance for ${targetDebt.name || "this debt"}`, hint: "Use the statement balance after payments, interest, and fees. Enter 0 only when paid off." } : null,
      result: debtInventoryConfirmed ? `${money(a.debts.total)} total entered debt remaining.` : "Debt list confirmation needed.", source: 2 });
    const reserveTarget = a.reserveTarget;
    const nextReserveCheckpoint = Math.max(starterTarget, L.round(a.expenses.essential));
    add({ id: "reserve", phase: 3, title: "Build a longer emergency reserve", kind: "outcome", done: a.monthlyReady && a.savingsKnown && a.emergency >= reserveTarget,
      why: `Your next checkpoint is ${money(nextReserveCheckpoint)}. The longer reserve target is ${money(reserveTarget)}.`,
      instructions: [`First protect one month of your entered essentials (${money(nextReserveCheckpoint)}). This is the next checkpoint shown on Home.`, `After that, this plan uses three months of essentials, with a $1,000 minimum (${money(reserveTarget)}), as a starting longer target.`, "Your situation may call for a different reserve. Review dependents, income stability, and likely unexpected costs.", "Keep the reserve accessible and update the balance as it grows. Rebuilding it after an emergency is part of the plan."],
      field: { path: "profile.savings", label: "Updated emergency savings balance", hint: "Enter your actual savings balance." }, progress: { current: a.emergency, target: reserveTarget },
      result: a.monthlyReady ? `${money(Math.max(0, reserveTarget - a.emergency))} to this planning target${months(reserveTarget) !== null ? `; about ${months(reserveTarget)} months at an unchanged pace, before withdrawals` : ""}.` : "Complete your monthly picture to calculate the reserve target.", source: 1 });
    add({ id: "future", phase: 3, title: "Choose Andrew's next longer-term goal", kind: "review", ready: debtInventoryConfirmed && a.debts.total === 0 && a.monthlyReady && a.emergency >= reserveTarget,
      signature: signature([reserveTarget, debtSig]), why: "Once today’s needs are covered, progress can serve a goal that matters to you.",
      instructions: ["Pick one goal such as replacing a car, education, or retirement. Write the goal and one next action below.", "Review workplace benefits, fees, time horizon, and risk before committing money. Andrew's Financial Tracker does not select investments.", "Keep a weekly money check-in, and revisit the plan whenever income, bills, or priorities change."],
      noteRequired: true, noteLabel: "Andrew's goal and first action", completeLabel: "I’ve chosen Andrew's next goal" });

    // A change in facts reopens its step; downstream achievements remain recorded but cannot bypass it.
    const currentIndex = steps.findIndex(s => !s.done);
    steps.forEach((s, index) => { s.status = s.done ? "done" : index === currentIndex ? "current" : "later"; s.number = index + 1; });
    const reviewedAt = Date.parse(p.lastReview);
    const elapsed = Number.isFinite(reviewedAt) ? now.getTime() - reviewedAt : Infinity;
    const reviewDue = elapsed >= 7 * 86400000 || elapsed < 0;
    const nextReview = Number.isFinite(reviewedAt) ? new Date(reviewedAt + 7 * 86400000).toISOString() : null;
    return { steps, current: currentIndex < 0 ? null : steps[currentIndex], completed: steps.filter(s => s.done).length, total: steps.length, available, contribution, contributionValid, overdue, monthlySig, reviewDue, nextReview, a };
  }

  function complete(raw, id, note = "", now = new Date()) {
    const state = L.normalize(raw), plan = build(state, now), step = plan.current;
    if (!step || step.id !== id || !["review", "inventory"].includes(step.kind)) throw new Error("Complete the current step first. Balance milestones require updated numbers.");
    if (step.noteRequired && !note.trim()) throw new Error("Add your next action or arrangement before marking this done.");
    if (step.kind === "inventory") {
      if (!step.inventoryReady && !step.canConfirmNone) throw new Error("Complete your debt details before confirming the list.");
      state.actionPlan.noDebts = step.canConfirmNone;
      if (step.inventoryReady) state.settings.debtMinimumSource = "detailed";
    } else if (!step.ready) throw new Error("Finish the information needed for this step first.");
    state.actionPlan.completed[id] = { at: now.toISOString(), signature: step.signature, note: note.trim().slice(0, 3000) };
    return state;
  }
  root.FinancePlan = { build, complete, PHASES, SOURCES, REVIEW_FIELDS };
  if (typeof module !== "undefined" && module.exports) module.exports = root.FinancePlan;
})(typeof window !== "undefined" ? window : globalThis);
