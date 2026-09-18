# Monthly picture and one-question setup

Implemented 2026-09-18 from the user's selected direction: a monthly picture, one question at a time.

## Delivered

- Three optional questions: monthly take-home income, essential costs, minimum debt payments.
- Draft saving on input, unfinished first-run resume, Back, per-question skip, early exit, and a no-debt-payments shortcut.
- Familiar US currency formatting accepted, with inline explanations for malformed setup amounts.
- Monthly result withheld when required totals are unknown; cash and savings are optional follow-up inputs.
- Next-step buttons open the relevant question or form.
- Rough expense/debt totals remain active during gradual detail entry, with an explicit reversible switch to individual totals.
- Existing saved plans retain their previous total source. Existing profile balances, due dates, unpaid rent, and overdue bills are not overwritten by monthly setup.
- Partial printable summaries and gated recovery guidance avoid assigning a confirmed stage from incomplete data.

## Verification

- `node --check app.js`, `node --check logic.js`, and `node tests.js` passed.
- Regression cases cover formatted/invalid numbers, known zero versus unknown, incomplete monthly inputs, gradual bills and debt entry, explicit total switching, and legacy saved-state normalization.
- HTML checks found no duplicate IDs or missing direct element references.
- Native browser checked desktop and 390 × 844 phone setup and monthly results. One input is visible at a time. Reload restored question 2 and its typed answer. No horizontal overflow was observed on the checked phone setup.
- Browser verified $3,200 income, $2,500 costs, and $150 minimums produce $550, and adding a $1,400 first bill keeps that $550 estimate.
- Browser verified malformed `3,20` gets inline feedback and blocks Continue until corrected or skipped. Skipped essential costs show the difference as Not yet known even when one individual bill exists.
- Browser console check returned no errors.
- Detector: three tiny-text warnings, five unconfirmed padding warnings, one inactive-report color advisory. Remaining warnings are outside the new setup's principal text and control changes. No broad visual redesign was performed.

## Limits

This pass does not replace the detailed expense/debt forms, add entry editing/undo, or revise the underlying debt-payoff and paycheck algorithms. No real-user study, screen-reader session, or final printed-page inspection was performed. All browser test amounts were fictional on an isolated local preview origin. No deployment occurred.


# Guided financial action plan

Implemented 2026-09-18 after the user requested a full, completable step-by-step plan.

## Delivered

- Fifteen adaptive steps spanning monthly inputs, overdue bills, cash, affordability, bill timing, savings, debt, reserves, and a longer-term goal.
- One current action with instructions, a clear completion rule, relevant form links, inline validation, saved working notes, and sources.
- Review checkoffs distinct from milestones that require actual updated balances; changed facts reopen the relevant earlier step.
- Explicit debt inventory confirmation, protected-obligation wording, user-selected ordering, and statement-based balance updates.
- User-chosen monthly contribution, bounded by the current monthly margin after planned sinking funds, with an in-plan change control.
- Six-part weekly review, one question at a time, pause/resume and draft persistence, dates, and capped review history.
- Editable expenses and debts with cancel controls; My progress view and a full printable step list including notes.
- Existing storage key and backup format retained with optional actionPlan state; sample mode remains temporary.
- Legacy optional extra-income panel now uses bill-first guidance instead of allocation percentages.

## Verification

- Both `node tests.js` and `node action-plan-tests.js` pass, along with JavaScript syntax checks.
- New scenarios exercise a complete journey, unknown/zero inputs, deficits, overdrafts, manual-completion restrictions, changed arrears, savings withdrawals, contribution bounds, debt confirmation, protected debts, paid-off minimums, changed dates, a zero-essential-cost reserve floor, seven-day reviews, and backup round trips.
- Browser walkthrough with fictional data on isolated port 4192 completed all 15 steps, persisted notes through reload, rejected an excessive contribution, and changed the contribution successfully.
- Weekly review paused with a typed draft, survived reload, resumed, recorded a review, and reopened a savings milestone after a balance reduction.
- Browser debt and expense edits updated the original entries; debt edit cancel restored add mode. A statement balance update refreshed the payoff step.
- Desktop and 390 × 844 phone inspections found one visible amount input and no horizontal overflow. Browser error log was empty.
- Printable report content contains all 15 steps and saved notes. Final paginated printer/PDF output was not inspected.

## Boundaries

No real bank data was entered during tests, no money was moved, and nothing was deployed. This is a deterministic, local educational planner with manual balances, fixed explained milestone defaults, and no bank reconciliation. Bill timing still requires the user's review; external CFPB links are references rather than endorsements. No user study or screen-reader session was performed.


# Reset warning and purge — 2026-09-18

Added Reset all data under More tools on desktop and phone, with the same entry under Data & backup. A native modal dialog names the deleted data, explains that deletion cannot be undone, offers Download backup first, focuses Cancel by default, and has a separate red Delete all data button. Escape cancels. All entry points use the same flow.

Reset removes only the app's saved key and clears in-memory state, form drafts, edit state, checkboxes, plan notes/progress, review history, report content, and backup-file input. It returns to setup question 1. A storage deletion event resets other open tabs running this version. If deleting stored data throws an error, existing state is retained and the dialog reports the failure. Sample mode never deletes the real saved key.

Validation: JavaScript syntax and both existing scenario suites passed. Browser tests on the fictional, isolated 127.0.0.1:4192 origin verified desktop and 390 × 844 phone warning layout, default Cancel focus, Cancel and Escape preservation, confirmed deletion, clearing an unsaved draft in another open tab, empty generated report, and persistence of the cleared state after reload. Browser error log was empty. The user's localhost:4191 data was not reset. Storage-failure handling was reviewed in source, not forced in the live browser.


# Period-aware history and Clarity hardening — 2026-09-18

## Delivered

- One selected calendar month shared by Detailed income and Spending. Dated entries from other months are excluded from calculations; undated legacy entries remain visible with a clear exclusion label.
- Spending audit copy names the active month and whether totals use dated transactions or monthly estimates. Annualized savings language is conditional on the same change holding for 12 months.
- Weekly review completion saves or updates one monthly snapshot containing dependable income, entered costs, difference, checking, savings, and confirmed total debt. The history is capped at 24 months and displayed under My progress.
- Home and Action plan now distinguish the next savings checkpoint from the longer three-month reserve target.
- Data & backup closes on navigation and when the phone menu opens.
- Clarity's live metadata and explanatory copy now use 12px and 14px floors respectively. The shared and selected stylesheets use one `Manrope` family name.
- `DESIGN.md`, `.impeccable/design.json`, the surface brief, product contract, and README now describe the implemented behavior and the actual two-layer Clarity CSS system.

## Verification

- `node --check app.js`, `node --check logic.js`, and `node --check action-plan.js` passed.
- `node tests.js` and `node action-plan-tests.js` passed, including selected-month transaction and income-entry cases plus same-month snapshot replacement.
- The design sidecar passed `jq empty`.
- The final Impeccable type scan returned no warnings; remaining items are advisory notices about the broad historical size vocabulary in the shared foundation stylesheet.
- One bounded browser pass inspected the Home, Spending audit, and My progress surfaces at desktop and 390 × 844 phone viewports using fictional sample data. No horizontal overflow or console warnings/errors were present. The backup disclosure closed on desktop navigation and when the phone menu opened.
- The browser pass covered the monthly-history empty state; populated row layout is covered by source and logic tests, not a second screenshot cycle.

## Boundaries

Snapshots are recorded when a weekly review finishes; the app does not infer historical balances for earlier months. Version 1 keeps a comparison list rather than adding charts, bank import, reconciliation, or transaction editing. No deployment occurred.
