# Three design options

Open `index.html` in this folder, or use the project's local server at `/design-options/`.

These are interactive design proposals, not an applied redesign. The existing application, calculation rules, saved financial data, and product/design documents are unchanged. All preview values are fictional. Preview changes live in memory and reset on reload or switching designs. No browser storage is read or written by the preview application.

1. **Clarity** — cool whites, blue accents, slim navigation rail, restrained typography. Recommended for the strongest balance of polish and familiar everyday use.
2. **Ledger** — warm neutral surfaces, editorial headings, horizontal navigation, open sections with fine dividers. More character and a little more spacious.
3. **Focus** — charcoal surfaces, muted mint controls, a compact summary above an action area and milestone. Best for a preference for dark interfaces.

All three include the current working setup, spending, debt, and plan screens. Navigation transitions last 190 milliseconds. Progress and control feedback remain subtle; the system reduced-motion preference disables animation. The Phone control previews the actual narrow layout.

`preview.html` and `demo-app.js` are copies of the current UI and its behavior, with in-memory sample data and presentation changes only. Financial calculations still use the existing `../logic.js`. The original source hashes are recorded in `source-baseline.json` to verify preservation. These copies are for comparison and are not a second production application.

Choice is pending. Once a direction is selected, apply its design consistently to the main app, review every screen and state, then update the authoritative design documentation.
