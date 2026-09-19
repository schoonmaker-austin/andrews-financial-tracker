# Financial Reset Planner

Financial Reset Planner is a private, local-first financial recovery tool. It is designed for variable income and financial stress: it uses dependable income, protects necessities and mandatory obligations first, and turns the numbers into a specific next action.

## Follow the action plan

After the monthly picture, open **Action plan**. It presents one current step and a collapsible full path of 15 steps: confirm the numbers, address overdue essentials, make monthly room, protect upcoming bills, build a starter cushion, confirm and reduce debts, grow a longer reserve, and choose a longer-term goal.

Each step explains what to do and how it completes. Review tasks can be checked off; financial milestones require updated actual balances. A changed income, obligation, bill date, or balance can reopen an earlier step. A chosen monthly contribution is capped by the entered monthly margin after planned sinking funds, and can be changed later. Bill timing must still be reviewed by the user; the app does not authorize transfers.

Notes and unfinished answers save locally as you type. Weekly check-ins ask one question at a time, can be paused and resumed, and keep the latest 52 completed reviews. Completing a review also saves or updates one monthly snapshot with income, costs, difference, checking, savings, and debt; **My progress** shows up to 24 monthly snapshots. Expenses and debts can be edited in place. **Print my steps** includes the whole path, current status, and working notes.

Savings defaults are $250, $500, then $1,000, followed by three months of entered essentials with a $1,000 floor. These are planning defaults, not universal requirements. Savings timing assumes an unchanged chosen contribution and no withdrawals; the action plan does not predict debt payoff dates. Supporting CFPB resources are linked directly in relevant steps.

## Use it on iPhone, iPad, and Chromebook

Open the published HTTPS address in a browser. The same address works on every supported device.

- **iPhone or iPad:** open the address in Safari, tap **Share**, choose **Add to Home Screen**, turn on **Open as Web App**, and tap **Add**.
- **Chromebook:** open the address in Chrome, open the three-dot menu, choose **Cast, save and share**, then choose **Install page as app**.
- Sign in with the same tracker account on every device. The newest plan is downloaded automatically. Changes save on the current device first and synchronize when internet access is available.

The app icon, standalone window, offline files, and install directions are supplied by `app.webmanifest`, `sw.js`, and `pwa.js`.

## Run the app locally

Open `index.html` in any modern browser for local-only use. No account, internet connection, server, database, or build step is required for calculations and device-local saving. Installation, offline caching, and device sync require the HTTPS version.

On first use, **Quick setup** asks three questions, one at a time: monthly take-home income, essential costs, and minimum debt payments. Every question can be skipped. Answers save as you type, interrupted setup resumes, and familiar amounts such as `3,200` or `$3,200.50` are accepted. The monthly picture shows missing amounts explicitly and only calculates the difference once all three totals are known. Checking, savings, and overdue bills are requested later, one at a time, as the action plan needs them. They can also be edited under **Cash & upcoming dates**. Detailed income, bill dates, transactions, debt balances, and learning tools stay under the main screens and **More tools** until they are useful.

For local development, an optional static server makes browser testing easier:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Files

- `index.html` — semantic interface and all application sections
- `styles.css` — shared layout, responsive, and print foundations
- `clarity.css` — selected Reset Ledger design: warm ruled surfaces, chartreuse/black poster hierarchy, local Manrope typography, and responsive refinements (legacy filename)
- `logic.js` — calculation, period filtering, monthly-snapshot, stage, debt-order, paycheck, and roadmap rules
- `action-plan.js` — guided steps, completion requirements, reopening rules, and review cadence
- `action-plan-tests.js` — complete-journey, debt, missing-data, and persistence regressions
- `app.js` — interface behavior, automatic saving, import/export, and report generation
- `cloud-sync.js` — sign-in, automatic sync, offline recovery, and whole-plan conflict protection
- `cloud-config.js` — public Supabase project address and publishable key; never place a secret key here
- `app.webmanifest`, `pwa.js`, and `sw.js` — app installation, icons, and offline shell
- `supabase/schema.sql` — account-owned plan table, access rules, and version-checked save function
- `tests.js` — calculation checks using fictional data
- `PRODUCT.md` — durable product requirements and chosen design direction

## Reset Ledger design

The main app uses the selected Reset Ledger direction across setup, the dashboard, spending, debts, planning, and the printable report. It combines a warm ledger-paper ground with a matte-black navigation cover, an electric-chartreuse monthly diagnosis, a dark next-action work order, and receipt-like supporting rows. User-triggered view changes use one short clip-and-saturation transition. The system's reduced-motion preference disables it.

The phone menu includes **More tools**, and **Data & backup** keeps download, restore, and reset available. Amounts and debt details remain visible on narrow screens.

The original three-option comparison remains in `design-options/`. It uses fictional, temporary data. For a fictional scenario in the main app, open `index.html?sample=1`; this mode never writes to or clears your saved plan, and edits reset on reload.

## How the calculations work

The main monthly result starts with minimum dependable income. It subtracts entered monthly expenses and debt minimums. Required/legally sensitive debt payments are included in survival cost unless a separate “Minimum required debt payments” expense has already been entered.

Detailed income and transaction audits use the selected calendar month. Dated entries from other months are excluded; older entries without dates stay visible and are labeled as not included. If the selected month has no dated transactions, the spending audit falls back to the entered monthly expense estimate and says so. Changing the selected month does not change the dependable-income planning baseline.

The stage engine evaluates the situation in this order:

1. **Financial Survival Mode** — unpaid rent, overdue required bills, immediate obligations greater than available cash, or dependable income below survival expenses.
2. **Stabilization** — obligations appear payable, but cash is below $250 or monthly cash flow is not positive.
3. **Starter Emergency Fund** — positive enough to work toward $250, $500, then $1,000.
4. **Debt Cleanup** — at least $1,000 of emergency savings exists and active debt remains.
5. **One-Month Buffer** — debt is handled; cash reserves are below one month of required expenses.
6. **Full Emergency Fund** — build from one month to at least three months of required expenses.
7. **Investing & Wealth Building** — no entered debt and at least three months of required expenses in entered emergency savings.

Blank numeric fields are unknown, not zero. The app keeps incomplete results open but labels the difference “Not yet known” instead of displaying skipped costs as zero. Recovery stages and savings guidance wait for monthly and cash information. Known amounts still appear so the user can make progress before every detail is available. For new plans, rough essential-cost and debt-payment totals stay active while individual items are added. A clearly labeled button switches to the detailed total once the user confirms that every item is included. Older saved plans preserve their previous total source. The two methods are never added together.

Weekly limits divide monthly flexible and discretionary categories by 4.33. The next-paycheck calculation funds unpaid rent and overdue bills first, then entered essential bills, weekly groceries/fuel, the emergency fund, and discretionary money. It never sends money or moves funds; it is a planning calculation only.

Debt avalanche sorts non-mandatory targets by highest interest rate. Debt snowball sorts them by smallest balance. Required or legally sensitive obligations remain protected in either method. A flexible family loan does not automatically outrank housing, emergency reserves, or interest-bearing debt.

## Device sync, local storage, and privacy

The browser always saves automatically to `localStorage` under `financial-reset-planner-v1`, so work is retained during an internet interruption. When device sync is configured and the user signs in, the app also sends the entered tracker plan to that Supabase project. Database access rules restrict each signed-in account to its own row. The app has no analytics, behavioral tracking, bank integration, advertising, or external AI call.

The Supabase publishable key in `cloud-config.js` is intentionally public and is protected by the database access rules. A secret key or service-role key must never be placed in browser code.

If two devices save before seeing one another's change, the version check prevents a silent overwrite. The newer complete snapshot wins and the app tells the user when it received a newer device change.

Clearing browser site data removes that device's offline copy and sign-in session. A signed-in plan remains available from the secure sync service unless **Reset all data** is confirmed. The confirmed reset replaces the synchronized financial information with a blank reset marker so a stale offline device cannot silently resurrect the deleted plan. Use **Export JSON** for a separate portable backup.

## Reset all entered data

Open **More tools → Reset all data** (on a phone: **Menu → More tools**). A warning names what will be deleted, offers a backup download, and requires a separate **Delete all data** confirmation. **Cancel — keep my data** and Escape dismiss it without changes.

When signed out, confirmation removes this app's saved data from the current browser site. When signed in, confirmation first clears the synchronized financial information and then clears the current device; an internet connection is required so a supposed reset cannot leave an unseen cloud copy behind. The reset clears unfinished forms, notes, progress, check-in history and generated report content, and returns to the first setup question. Other sites and previously downloaded backup/PDF files are not deleted. Sample mode clears only its temporary fictional data.

## JSON backup and import

**Export JSON** downloads all app data as a readable `.json` file. **Import JSON** restores a previously exported file. Import normalizes missing arrays and settings so older Version 1 backups remain usable.

Monthly snapshots are included in the same backup. A later weekly review in the same calendar month updates that month instead of creating a duplicate.

JSON is plain text and may contain sensitive financial information. Store backups somewhere you trust.

## Print / Save as PDF

Generate the plan, open **Printable plan**, then choose **Print / save plan**. Print CSS hides navigation, forms, and controls and formats the report for US Letter paper. In the browser print dialog, choose “Save as PDF” if a PDF is needed.

## Connect secure device sync

1. Create a Supabase project.
2. Run `supabase/schema.sql` in its SQL editor.
3. In `cloud-config.js`, enter the project's HTTPS URL and its **publishable** key.
4. Keep email/password authentication enabled. Decide whether email confirmation should be required before first sign-in.
5. Run `node cloud-sync-tests.js`, then test that Account A cannot read, update, or delete Account B's row before publishing.

The application remains local-only when the two public configuration values are blank.

## Published address

The app is published from `main` at:

`https://schoonmaker-austin.github.io/andrews-financial-tracker/`

GitHub's free Pages plan requires this source repository to be public. The repository contains application code and fictional test cases only. Financial entries and account sessions stay in the user's browser and configured Supabase project; they are never committed to GitHub.

## Run the tests

With Node.js installed:

```bash
node tests.js
node action-plan-tests.js
node cloud-sync-tests.js
node pwa-tests.js
```

The included fictional cases cover negative cash flow, positive cash flow with low savings, debt prioritization, legally protected obligations, wealth-building readiness, missing inputs, month-filtered transaction and income-entry totals, and monthly snapshot updates.

## Modify thresholds

Stage thresholds and milestone labels are in `logic.js`:

- `STAGES` controls names and next-milestone copy.
- `analyze()` contains the ordered stage rules.
- `emergencyTarget` contains the $250 / $500 / $1,000 milestone progression.
- `extraRule()` retains legacy allocation rules; the visible extra-income guidance now prioritizes obligations rather than fixed percentages.
- `paycheckPlan()` contains next-paycheck priority order.

The guided plan rules and milestone defaults are in `action-plan.js`. Change rules cautiously and rerun both test files afterward.

## Version 1 limitations

- Transactions are entered manually; there is no bank import or automatic reconciliation.
- Due-day planning uses entered values and does not yet model every billing-cycle edge case.
- The guided plan does not estimate debt payoff dates or account for daily interest and fees. Balances must be updated from statements.
- The tool does not replace legal, tax, credit, or individualized investment advice.
- Device sync requires internet access and a configured Supabase project. The app is not end-to-end encrypted from the hosting provider; do not enter bank passwords, card numbers, Social Security numbers, or account-recovery secrets.
- Browser print output can vary slightly between Chrome, Safari, Firefox, and Edge.

## Potential Version 2 features

- CSV transaction import with local category matching
- Editable paycheck frequency and bill-calendar forecasting
- Full debt amortization and payoff-date simulation
- Local encryption and optional device-to-device backup
- Custom stage thresholds and rule templates
- More detailed sinking-fund forecasts
- Trend charts and deeper explanations of what changed between monthly snapshots
