# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS, and vanilla JavaScript delivered as an installable progressive web app. Core calculations and device-local saving continue to work without an account. Secure cross-device sync uses Supabase authentication and one account-owned database record when configured; offline changes remain on the device and sync after reconnection.

## Users

The primary user is an adult with variable piecework income who is under financial pressure, has little savings, and needs help seeing where money is going and deciding what to do next. The first version is written for someone with little financial knowledge and must remain understandable without finance jargon.

## Product Purpose

Financial Reset Planner helps a person diagnose their current financial position, protect necessities, stabilize cash flow, build an emergency reserve, handle debt in the right order, and progress toward longer-term savings and investing. Success means the user can answer: Where am I financially? What should I do with the next dollar? What milestone am I working toward?

## Positioning

This is a guided recovery system, not a passive budget spreadsheet. It converts local financial inputs into a stage-specific triage diagnosis, protected-spending plan, weekly limits, paycheck allocation, and a saved, step-by-step action plan based on dependable income rather than hoped-for income.

## Operating Context

The user opens one web address on an iPhone, iPad, or Chromebook and may install it to the Home Screen or app launcher. After signing in once per device, the user answers three monthly questions one at a time, sees a monthly picture, updates variable income and spending, performs a weekly ten-minute review, generates a human-readable reset plan, and can print that plan or save it as a PDF. Data may be exported to JSON for backup and imported later.

## Capabilities and Constraints

- The app always keeps an offline copy in that browser using `localStorage`. When the user signs in, the same plan is also synchronized to an account-owned Supabase record so it can appear on other signed-in devices.
- The app automatically saves, supports reset, JSON export/import, browser printing, installation, offline loading, and delayed sync after reconnection.
- Inputs must distinguish unknown values from known zeroes and avoid false precision when information is incomplete.
- Planning uses dependable income as the baseline and treats extra income separately.
- The guided action plan shows one current step, explains its completion criteria, preserves notes and reviews, and reopens earlier steps when the underlying facts change. Balance milestones require actual updated numbers. Legacy stage calculations remain in secondary tools.
- Legally sensitive and mandatory obligations remain protected regardless of debt payoff method.
- The app supports editable expenses, income entries, transactions, debts, sinking funds, extra-income guidance, and resumable weekly check-ins.
- Detailed income and transaction calculations use an explicitly selected calendar month. Completed weekly check-ins retain up to 24 monthly snapshots of income, entered costs, difference, checking, savings, and debt.
- Version 1 has no bank connection, analytics, behavioral tracking, external AI, or external image assets. Network calls are limited to authentication and the signed-in user's own synchronized plan.
- Financial guidance is educational planning support, not individualized legal, tax, or investment advice.

## Brand Commitments

The product name is **Financial Reset Planner**. Its voice is compassionate, direct, calm, plainspoken, and never shaming. It must plainly identify mathematically unsustainable situations while framing a budget as permission to spend intentionally rather than punishment. The interface should be minimal, modern, readable, responsive, and accessible, avoiding finance clichés, excessive gradients, excessive motion, and cartoonish graphics.

The chosen visual direction is **The Reset Ledger**: an authored household workbench made from warm ledger paper, matte near-black ink, electric chartreuse, one coral mark, blue utility links, and local Manrope typography. Lead with one unmistakable monthly diagnosis, the next financial move, and a quieter receipt-like trail of supporting numbers. Missing inputs remain visible. Cash details and savings milestones follow as optional next steps. Keep the interface bold but practical, with immediate access to useful content and no finance clichés.

## Evidence on Hand

The supplied product brief is the sole authority. Version 1 uses fictional demonstration scenarios only for testing; it has no testimonials, institutional endorsements, market claims, or external assets and must not invent any.

## Product Principles

1. Protect survival and mandatory obligations before optimization.
2. Plan from dependable money, not optimistic projections.
3. Turn every important number into a concrete next action.
4. Be honest about deficits without shame or false precision.
5. Keep the system local, simple, and easy to recover or back up.

## Accessibility & Inclusion

Use semantic HTML, visible keyboard focus, properly associated labels, sufficient contrast, reduced-motion support, and responsive layouts. Do not rely on color alone to convey financial state. Use plain English and define unavoidable financial terms in context.

## Direction contract

**THESIS:** The Reset Ledger makes financial triage feel like an authored household workbench rather than another pale software dashboard.

**OWN-WORLD:** Warm ledger paper, matte near-black ink, electric chartreuse, a single coral mark, blue utility links, and local Manrope create the identity. Poster-scale type names the situation; strict rules, receipt dividers, square controls, and inline line icons organize the work without external imagery.

**STORY:** The user answers one question at a time about monthly income, essential costs, and debt payments, then sees a monthly picture. Drafts save immediately. A skipped figure stays unknown; the monthly difference waits until its required inputs are known. Individual bills do not replace a rough total until the user explicitly switches. More detail remains available when useful.

**FIRST VIEWPORT:** A matte-black 252px rail and quiet utility header frame the home view. An oversized page title leads into a chartreuse monthly diagnosis poster with a black figure rail and a near-black next-action block. Ordered next actions and four receipt-like financial facts follow. On a phone, this hierarchy becomes a single pocket-workbook column while Menu preserves access to every section and backup control.

**FORM:** The Reset Ledger is the single selected production appearance. `styles.css` supplies shared layout and print foundations; the legacy-named `clarity.css` supplies the replacement visual system. User-triggered view and setup-step changes receive one brief clip-and-saturation ledger arrival; reduced-motion preferences disable it. Initial content appears immediately.

**FINISH:** Keep the selected direction consistent across setup, home, detailed forms, plans, learning, and report views. Preserve existing calculations, the saved-data key, import/export, printing, keyboard paths, and sample-mode isolation. The source-backed visual reference is `DESIGN.md` with `.impeccable/design.json`; record actual validation separately from implementation claims. There are no shipping raster assets.

## Guided action plan — 2026-09-18

User authorization: “I want a full action plan that can be completed step by step.” Keep monthly-first setup and one question at a time. The 15-step path has four phases: know where you stand; get the month under control; build your cushion; reduce debt and move forward. Only the first unfinished step is actionable; later steps are visible as previews. Previously achieved outcomes can remain recorded while an earlier issue is addressed again.

Manual completion is limited to reviews, arrangements, debt-list confirmation, and choosing a goal. A conversation with a bill provider never erases the amount overdue. Savings and payoff milestones follow actual entered balances. Debt-list confirmation requires complete balances/minimums and, for highest-interest ordering, interest rates. An empty debt list must be explicitly confirmed and cannot contradict entered minimum payments.

The chosen monthly amount applies to one goal at a time and must fit the entered monthly margin after planned sinking funds. Upcoming bills must be reviewed separately. The plan never moves money, deducts assumed payments, or promises a debt payoff date. Savings targets remain explained planning defaults. General priorities cite CFPB resources; there is no claim that CFPB approved this application.
