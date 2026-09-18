# Multi-month false-data test report

Tested: September 18, 2026  
Test address: isolated local origin at `http://127.0.0.1:4174/`  
Data: fictional April–September 2026 income, expenses, transactions, debts, balances, and check-ins

## Bottom line

The planner works well as a **current-month guided recovery plan**. It successfully moved the fictional user from overdue-bill triage to a starter fund, debt payoff, and then a longer emergency reserve.

It is **not yet reliable as a multi-month transaction tracker**. When six months of transactions are entered, the Spending audit adds all six months together and labels the result as if it were one month. The app also does not preserve complete month-by-month snapshots, so it cannot show historical income, spending, savings, and debt trends.

## Six-month progression observed

| Point in test | Current stage | Monthly income | Costs + debt | Monthly difference | Savings | Debt | Plan |
|---|---:|---:|---:|---:|---:|---:|---:|
| Starting month | Financial Survival Mode | $3,600 | $3,160 | $440 | $0 | $4,000 | 5/15; make a plan for $850 overdue |
| Month 2 | Starter Emergency Fund | $3,600 | $3,055 | $545 | $500 | $4,000 | 10/15; build the $1,000 starter cushion |
| Month 4 | Debt Cleanup | $3,900 | $3,055 | $845 | $1,000 | $2,850 | 12/15; work down the 24.99% credit card |
| Month 6 | One-Month Buffer | $3,900 | $2,890 | $1,010 | $2,500 | $0 | 13/15; build a longer emergency reserve |

The weekly-review history correctly showed the fictional margin improving from $395 to $695 to $860 after planned sinking-fund savings.

## Audit health score

| Dimension | Score | Key finding |
|---|---:|---|
| Accessibility | 3/4 | Labels, error text, keyboard tabs, focus behavior, and semantic controls worked; several 11–13px text styles remain small. |
| Performance | 3/4 | Static and responsive with 54 transaction rows; no browser errors, but historical lists grow without paging or month filtering. |
| Responsive design | 3/4 | No horizontal overflow at a 375px content width; the Data & backup popover can stay open and cover content after mobile navigation. |
| Theming | 3/4 | The selected Clarity theme is coherent; the detector found legacy token and type-ramp drift. |
| Implementation integrity | 2/4 | Current-month guidance is coherent, but multi-month transaction totals are presented as monthly facts. |
| **Total** | **14/20** | **Good for current-month planning; not ready for historical tracking.** |

Implementation integrity verdict: **Fail for the requested multi-month use case; pass for the narrower current-month guided-plan use case.**

Issues found: **0 P0, 2 P1, 3 P2, 1 P3**.

## Findings

### P1 — Six months of transactions are reported as one month

- Location: `logic.js:135-167`, `app.js:370-390`
- The audit uses every transaction in storage without filtering by date or month.
- With 54 fictional transactions from April through September, it displayed **$17,580 total spending**, **$1,150/month restaurants**, and **$230/month subscriptions**. Those are six-month totals, not monthly amounts.
- Impact: a user can be told they spend far more per month than they actually do, producing incorrect annual-savings guidance.
- Recommendation: add a selected month (or date range), filter transactions before calculating totals, and state the active period beside every result.
- Suggested command: `$impeccable harden`

### P1 — The app does not retain full monthly history

- Location: `README.md:123-131`; current state model in `logic.js`
- The plan retains up to 52 check-in records, but each record contains only a date, whether the monthly picture was ready, and one margin number. It does not preserve the month's income, expenses, savings, or debt balances.
- Impact: the user can see current progress and a short margin history, but cannot compare April with September or explain what changed.
- Recommendation: save a small monthly snapshot containing income, entered costs, margin, checking, savings, and total debt; show a simple month-by-month comparison.
- Suggested command: `$impeccable shape`

### P2 — Home and Action plan show different savings targets

- Location: `logic.js:203-227`, `action-plan.js:117-124`, `app.js:346-354`
- At month six, Home showed **Next savings step: $2,700**, while Action plan showed **$2,500 of $8,100** for the current reserve step.
- Both figures can be defensible (one month versus three months), but the relationship is not explained.
- Impact: the user does not know whether the real target is $2,700 or $8,100.
- Recommendation: label $2,700 as the next checkpoint and $8,100 as the longer target, in both views.
- Suggested command: `$impeccable clarify`

### P2 — Mobile backup menu can cover the next screen

- Location: `app.js:102-124`, `app.js:233-262`
- On a phone-sized viewport, opening Data & backup and then navigating leaves the popover open over the new page.
- Impact: the first part of the destination screen is obscured until the user closes the menu.
- Recommendation: close `.data-menu` whenever navigation occurs or when the mobile menu opens.
- Suggested command: `$impeccable adapt`

### P2 — Some supporting text is too small

- Location: examples include `clarity.css:261`, `clarity.css:267`, `clarity.css:279`, `clarity.css:295`, and `clarity.css:321`
- The technical detector found repeated 11px text and several 13px body styles.
- Impact: dates, row metadata, roadmap labels, and report labels can be tiring to read, especially on a phone.
- Recommendation: use at least 12px for metadata and 14px for explanatory body copy unless space is genuinely constrained.
- Suggested command: `$impeccable typeset`

### P3 — Design-system documentation and production CSS have drifted

- The detector returned 161 items, but 150 were advisories about colors or type sizes rather than confirmed user-facing failures. The 11 warnings were five padding checks, three tiny-text checks, and three local-font naming checks.
- Impact: future changes are harder to reason about and automated checks are noisy.
- Recommendation: reconcile the selected Clarity styles with `DESIGN.md`, remove or clearly quarantine legacy theme values, and document intentional font naming.
- Suggested command: `$impeccable document`

## What passed

- Financial calculation tests: `node tests.js`
- Guided action-plan tests: `node action-plan-tests.js`
- JavaScript syntax checks for `app.js`, `logic.js`, and `action-plan.js`
- Quick setup blocks invalid currency text and gives a useful error
- Expense, transaction, income, debt, and sinking-fund forms add and recalculate correctly
- Debt avalanche ordering and protected obligations worked in the sample
- Weekly check-in pauses and resumes correctly
- Keyboard navigation works across the Spending tabs
- Imported data persisted after a full browser reload
- Backup export reported success
- Reset warning accurately described the deletion and Cancel preserved the data
- Printable report generated with all 15 steps and the current next action
- Phone layout had no horizontal overflow
- Browser console showed no warnings or errors

## Positive findings

- The action plan advances conservatively: balances must actually change before savings or debt milestones complete.
- Unknown values remain different from zero.
- Rough totals are replaced rather than double-counted when detailed totals become authoritative.
- The fictional journey remained understandable at each stage and produced a specific next action.
- The final six-month state survived reload and remains isolated from other browser origins.

## Recommended order

1. **P1 — `$impeccable harden`**: make transaction and income-entry calculations period-aware.
2. **P1 — `$impeccable shape`**: define and display a minimal monthly snapshot history.
3. **P2 — `$impeccable clarify`**: explain next checkpoint versus longer reserve target.
4. **P2 — `$impeccable adapt`**: close the backup popover on navigation.
5. **P2 — `$impeccable typeset`**: raise the smallest supporting text.
6. **P3 — `$impeccable document`**: reconcile the Clarity implementation with its design documentation.
7. **Final — `$impeccable polish`**: run one bounded desktop/mobile visual pass after fixes.

You can ask me to run these one at a time, all at once, or in any order you prefer.

Re-run `$impeccable audit` after fixes to see the score improve.
