---
name: Financial Reset Planner — The Reset Ledger
description: An authored household workbench built from warm ledger paper, hard ink, and decisive poster color.
colors:
  ink: "#171813"
  muted: "#615f54"
  surface: "#eee9dc"
  paper: "#fffdf5"
  line: "#b7b2a5"
  field: "#fffef9"
  chartreuse: "#dfff3f"
  chartreuse-deep: "#caeb2d"
  tomato: "#f4573d"
  tomato-soft: "#ffe0d8"
  utility-blue: "#3659d9"
  utility-blue-soft: "#e3e9ff"
  positive: "#167458"
  danger: "#b53125"
  warning: "#765600"
  warning-soft: "#ffedaa"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "clamp(42px, 5.4vw, 72px)"
    fontWeight: 780
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  poster:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "clamp(34px, 4.4vw, 58px)"
    fontWeight: 780
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "25px"
    fontWeight: 740
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "10px"
    fontWeight: 800
    lineHeight: 1.4
    letterSpacing: "0.12em"
  control:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "12px"
    fontWeight: 760
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  square: "0"
  control: "2px"
  compact: "3px"
  panel: "4px"
  system: "5px"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "28px"
  poster: "38px"
  view: "46px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.chartreuse}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-primary-hover:
    backgroundColor: "{colors.chartreuse}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-quiet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-danger:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.danger}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "45px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
  nav-active:
    backgroundColor: "{colors.chartreuse}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
---

# Design System: Financial Reset Planner — The Reset Ledger

## Overview

**Creative North Star: "The Reset Ledger"**

The Reset Ledger makes financial triage feel like an authored household workbench rather than another pale software dashboard. Warm ledger paper, matte near-black ink, electric chartreuse, a single coral mark, and blue utility links create a practical world assembled from receipt stock, public-information posters, and marked-up monthly plans.

The hierarchy is intentionally blunt. Poster-scale diagnoses name the situation; a dark next-move block turns the answer into work; quieter ruled rows preserve the supporting trail. `styles.css` supplies the shared structure and print foundations, while `clarity.css` now carries this replacement visual world despite its legacy filename. Local Manrope and inline SVG are the only shipped visual assets; there are no raster images or external dependencies.

**Key Characteristics:**

- Warm, visibly ruled paper instead of a blank application canvas.
- Near-black navigation and work-order surfaces with chartreuse active states.
- Poster-scale headlines paired with compact receipt labels and tabular figures.
- Flat, square-edged panels organized by solid and dashed rules.
- One coral mark for urgency or progress, with blue reserved for utility and focus.
- A brief clip/filter reveal after user-triggered navigation or setup changes; no initial entrance effect.

## Colors

The palette behaves like ink and highlighter on household paperwork: neutrals carry nearly everything, chartreuse makes one decision unmistakable, coral marks pressure, and blue remains a functional signal.

### Primary

- **Electric Chartreuse:** Active navigation, selected strategies, the diagnosis poster, milestone actions, selection color, and compact work-order labels.
- **Matte Ledger Ink:** Navigation cover, dark action blocks, button bodies, figure rails, strong rules, and primary text.

### Secondary

- **Tomato Mark:** Crisis diagnosis, active tabs, setup and plan progress, and small authored marks.
- **Utility Blue:** Links, focus outlines, carets, and current-step text. It is functional, not decorative.
- **Positive Green:** Positive financial states only.
- **Danger Red:** Errors, destructive controls, and negative values.
- **Warning Ochre:** Protected-obligation warnings on a pale warning slip.

### Neutral

- **Ledger Surface:** The warm ruled workspace behind content.
- **Paper:** Ordinary panels, the running header, and receipt-like summaries.
- **Field Paper:** Slightly cleaner input stock that separates editable values from the page.
- **Muted Ink:** Explanations, timestamps, labels, and secondary status.
- **Rule:** Quiet dividers, receipt perforations, and secondary borders.

**The One Highlighter Rule.** Chartreuse names the active decision; it must not become general decoration.

**The Meaning Before Color Rule.** Every financial state needs words or a number as well as color.

## Typography

**Display Font:** Manrope (with `ui-sans-serif` and generic sans-serif fallbacks)  
**Body Font:** Manrope (with `ui-sans-serif` and generic sans-serif fallbacks)

**Character:** One variable local face carries the entire product. Very heavy, tightly tracked display type gives the ledger its poster authority; compact labels and calm body copy keep dense financial information usable.

### Hierarchy

- **Display:** Poster-scale view titles, balanced to short lines. On phones the range tightens to roughly 38–54px.
- **Poster:** The chartreuse monthly diagnosis; large, blunt, and capped to a short measure.
- **Headline:** Section titles such as “Do this next” and other action-led headings.
- **Body:** Plain-language explanation with a readable 60–68 character measure where practical.
- **Label:** Uppercase receipt metadata, running-header text, and eyebrow labels.
- **Control:** Buttons, navigation, tabs, and compact actions.

**The Comparable Figures Rule.** Use tabular numerals for balances, totals, allocations, progress amounts, and financial summaries.

**The Poster Then Receipt Rule.** Large type states the diagnosis once; supporting details step down sharply into compact labels and ruled rows.

## Layout

The desktop shell uses a sticky 252px navigation rail and a content column capped at 1320px. The running header is at least 71px high. Views use 46px top padding, fluid side padding up to 66px, and 76px bottom padding. The home hero is a wide diagnosis poster beside a narrower dark next-move panel; a ruled action row and a four-cell receipt follow.

At 1100px and below, the rail becomes 210px, the home hero stacks, and multi-column forms reduce their count. At 760px and below, the rail disappears in favor of a black in-flow mobile menu; view padding becomes 29px by 16px, setup and work surfaces stack, data rows protect their actions and amounts, and financial summaries use one or two columns. A final 380px rule handles very narrow phones. The reviewed phone target is 390px.

The setup shell is a centered two-part workbook spread up to 1030px wide. On phones it becomes one vertical notebook: the black introduction precedes the paper question area rather than disappearing. The 32px horizontal and vertical ruling on the desktop canvas is deliberate material, not incidental texture.

Print uses letter paper with 0.55in margins. App navigation and controls disappear, the report loses its outer border and padding, headings avoid orphaning, and report sections stay together when possible.

## Elevation & Depth

The system is flat by default. Ordinary surfaces use paper fill, ink or rule borders, ruled backgrounds, and spacing—not floating cards. The single structural exception is the setup shell, which uses an ambient `0 24px 60px rgba(23,24,19,.16)` shadow and no border. The toast uses `0 18px 44px rgba(23,24,19,.14)`; menus and ordinary panels do not use shadow.

**The Workbench Rule.** If a surface can be separated with a rule, spacing, or stock color, it does not get a shadow.

## Shapes

The form language is cut paper, not soft software. Controls and notices use 2px corners; compact framed regions use 3px; panels and the setup shell use 4px; the legacy system radius resolves to 5px. Receipt rows are often square and divided by solid or dashed rules. Circles are reserved for ordered steps and status marks; progress tracks are straight-edged.

**The Cut-Paper Rule.** Do not introduce rounded SaaS cards, pills, glass panels, or decorative blobs. A pill shape is justified only by a genuinely circular marker or legacy semantic control.

## Components

### Buttons

Primary buttons are near-black with chartreuse text; hover reverses them to chartreuse with ink and lifts them 2px. Secondary buttons are paper with an ink border and turn chartreuse on hover. Quiet actions retain paper and a softer border. Destructive buttons use danger text and border, then a tomato-soft hover. Standard controls are 42px high; setup buttons are 46px; mobile navigation actions are at least 42–44px.

Every keyboard-focusable control receives a 3px utility-blue outline with a 3px offset. Fields use a 2px offset so the outline stays visually attached.

### Inputs and Tabs

Fields use clean field paper, a medium neutral stroke, 2px corners, and a 45px minimum height. Currency and percent wrappers behave as one outlined control. Setup amount inputs grow to 58px high with 22px figures. Native-invalid fields use danger red. Tabs retain a simple bottom rule; the active tab is marked in tomato and remains keyboard-operable.

### Navigation

The desktop rail is a matte near-black cover. Inactive items use warm gray text and a faint dark hover; the active route becomes a solid chartreuse label with ink text. The brand mark is square and chartreuse. Mobile navigation retains the black cover and uses a two-column grid, preserving access to More tools and Data & backup.

### Diagnosis Poster

The monthly diagnosis is a chartreuse, ink-bordered poster with one diagonal “RESET / MONTH” strip on desktop. A black figure rail holds three comparable monthly values. Crisis replaces chartreuse with tomato while keeping the explicit diagnosis text. On phones the decorative strip disappears and the figure rail becomes stacked label/value rows.

### Next-Move Block

The dark home-side panel pairs a single coral rule and chartreuse flag with a direct headline, supporting copy, progress when applicable, and one chartreuse action. Its role is to turn the diagnosis into the next practical move, not to summarize everything.

### Receipt Rows and Work Orders

Supporting facts, metrics, monthly history, and data lists use shared borders, dashed separators, compact labels, and tabular values. The Action plan’s current step is a paper “CURRENT WORK ORDER” with a chartreuse label, oversized instruction heading, and tomato list markers. Composer headers reverse to ink with paper text.

### Setup and Feedback

Quick setup is the opening workbook spread: black introduction, paper form, tomato step bar, one monthly question at a time. User-triggered view and setup-step changes run a 360ms clip/filter reveal from a 14% lower inset and reduced saturation to the settled surface. Initial routing passes animation off. Reduced-motion disables animation and transitions. Toasts are ink slips announced through a polite live region; reset remains a modal dialog with a separate danger action.

## Do's and Don'ts

### Do:

- **Do** let one poster-scale diagnosis and one next move dominate the first viewport.
- **Do** use chartreuse for the active decision, tomato for pressure or progress, and blue for links and focus.
- **Do** preserve the ruled/grid canvas, hard rules, square utility controls, and receipt-like numerical trails.
- **Do** keep unknown values visibly unknown and pair every semantic color with explicit language.
- **Do** preserve local-only storage, responsive navigation, keyboard focus, reduced-motion behavior, and print output when extending the interface.
- **Do** reuse local Manrope, inline SVG, and tabular numerals; no raster assets ship.

### Don't:

- **Don't** restore the pale Clarity dashboard, cobalt primary buttons, slate rail, or rounded white card system.
- **Don't** soften ordinary content into floating cards, broad shadows, pills, gradients, glass, or generic dashboard chrome.
- **Don't** scatter chartreuse or coral across low-priority content; their rarity gives the hierarchy force.
- **Don't** animate the initial page load or add continuous decorative motion.
- **Don't** hide secondary tools, destructive consequences, required financial labels, or missing-data states on small screens.
