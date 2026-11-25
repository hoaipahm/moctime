---
name: Mốc
description: A warm, tactile personal space for everyday life.
colors:
  peach-ground: "#ffeada"
  cream-paper: "#fff6eb"
  ink: "#242320"
  amber: "#f5ab22"
  coral: "#f67a78"
  teal: "#52b9b6"
  sky-blue: "#8acbdb"
typography:
  headline:
    fontFamily: '"Nunito Sans", sans-serif'
    fontSize: "35px"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: '"Nunito Sans", sans-serif'
    fontSize: "21px"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  clock:
    fontFamily: '"Nunito Sans", sans-serif'
    fontSize: "clamp(42px, 4.4vw, 70px)"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  label:
    fontFamily: '"Nunito Sans", sans-serif'
    fontSize: "14px"
    fontWeight: 800
rounded:
  input: "10px"
  button: "11px"
  panel: "16px"
  dialog: "22px"
  pill: "999px"
spacing:
  field-gap: "7px"
  control-gap: "8px"
  section-gap: "12px"
  compact-grid: "16px"
  grid: "20px"
  panel-inset: "23px"
components:
  button:
    backgroundColor: "{colors.cream-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "10px 16px"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream-paper}"
    rounded: "{rounded.button}"
    padding: "10px 16px"
  panel:
    backgroundColor: "{colors.cream-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "23px"
  input:
    backgroundColor: "{colors.cream-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "11px 13px"
---

# Design System: Mốc

## Overview

**Creative North Star: “Your everyday paper desk.”** This phrase describes the built interface; the pinned user screenshot remains the visual authority. Peach ground, cream paper, heavy friendly lettering, dark outlines and hard offset shadows make a personal utility feel approachable and physical. The oversized amber clock anchors Today; coral, teal and blue panels distinguish useful information.

The direction is grounded in PRODUCT.md and .impeccable/surfaces/app.md, with code in src/style.css and src/themes.ts as the token source. This documents the incumbent system rather than proposing a new identity.

**Key Characteristics:**

- Warm cream and peach defaults, flat functional accent colors.
- Rounded outlined panels and visibly pressable controls.
- Desktop sidebar; mobile header, bottom navigation and slide-up sheet.
- Vietnamese, English, French and Chinese share one persisted locale.

## Colors

The default `coral` theme is named **Coral Cream**. The frontmatter records its literal primitives; CSS uses `--bg`, `--paper`, `--ink`, `--amber`, `--coral`, `--teal` and `--blue`, assigned by App.tsx from the selected theme.

### Primary

**Amber** anchors the clock, selected navigation and prominent add actions. Colored panel text uses the fixed dark ink `#242320`, including in night themes, to keep bright accents readable.

### Secondary

**Coral** carries upcoming occasions; **Teal** carries countdowns and useful personal actions; **Sky Blue** carries world clocks and soundscape containers. Color supports content hierarchy; headings, icons and labels also identify purpose.

### Neutral

**Peach Ground** is the page and sheet ground. **Cream Paper** fills neutral panels and controls. **Ink** forms text, outlines, focus rings and hard shadows. In dark themes the semantic ink becomes light; outlines and shadows follow it rather than staying literally black.

There are **24 palettes**, each mapping the same seven slots. The six dark variants are Neon Night, Grape Night, Forest Night, Midnight Ink, Cocoa Night and Plum Velvet. The other palettes are Coral Cream, Mint Garden, Lavender Letter, Ocean Blue, Rose Milk, Coffee Paper, Lemon Sorbet, Terracotta, Sky Cotton, Peach Club, Sage Studio, Cherry Soda, Sand Dune, Arctic Ice, Paper & Ink, Apricot Tea, Lilac Sky and Lagoon. Full alternate values remain authoritative in src/themes.ts; do not fork them into a second palette implementation.

## Typography

**Display and body font:** self-hosted Nunito Sans with `sans-serif` fallback. @fontsource/nunito-sans 5.3.0 bundles Latin and Vietnamese weights 400, 600, 700, 800 and 900 through local CSS imports. Font files ship with the app; no runtime font service is required. The package license credits The Nunito Sans Project Authors under SIL Open Font License 1.1. Chinese glyphs use the available system sans-serif fallback; no dedicated CJK font is bundled.

Headings use weight 900 with balanced wrapping. Page titles are 35px desktop and 29px mobile; section titles default to 21px desktop and 20px mobile. Form labels are 14px/800 with 7px label-to-control gaps. Paragraphs use line-height 1.6; the root weight is 600. The clock uses tabular numerals, 900 weight, tight tracking and a responsive desktop size; it is 65px on phones, 60px below 371px and 76px on wide desktops.

Preserve accents and localized date formatting. Give French labels room to wrap and allow Chinese system fallback metrics; do not force English widths on translated navigation or forms.

## Layout

The desktop sidebar is fixed at 230px; the main shell offsets by the same amount. Main content has a 1360px maximum width with 32px 38px 20px padding. Today uses a two-column dashboard with a 20px gap. Panels have `min-width: 0` to permit shrinkage.

- **1500px and wider:** sidebar 250px, main padding 40px 55px, dashboard columns 1.2fr/1fr.
- **761–1150px:** sidebar 195px, main padding 28px 25px, 16px dashboard gaps and tighter typography.
- **760px and narrower:** hide sidebar, reset shell offset, show sticky header and fixed bottom navigation. Main padding is 24px 18px 100px. Clock and major panels span the dashboard; coral and teal summary panels remain paired. The final header minimum height is 76px. Bottom navigation includes safe-area padding and an elevated 50px add button.
- **370px and narrower:** side padding drops to 14px and gallery becomes one column.

Desktop dialogs are centered, at most 550px wide and scroll within `calc(100dvh - 50px)`. Mobile sheets fill the width, have 23px top corners and a 90dvh maximum height, sit at the bottom, and include bottom safe-area padding. The menu has an 88dvh maximum height. Calendar navigation wraps into its own row on mobile; month controls are 48px square. Keep horizontal overflow out of menu, forms and translated headings.

## Elevation & Depth

Depth is structural and tactile: crisp ink outlines plus unblurred offset shadows. The muted blurred dialog backdrop is an overlay treatment, not a card shadow.

- Panel: `3px 4px 0 var(--ink)`.
- Button: `2px 3px 0 var(--ink)`; icon button: `1px 2px 0 var(--ink)`.
- Chip: `1px 1px 0 var(--ink)`.
- Desktop sheet: `5px 6px 0 var(--ink)`; mobile sheet: `0 -4px 0 var(--ink)`.

Buttons transition transform, shadow and background over 140ms ease. Press translates 2px diagonally and removes the shadow. Reduced motion disables animation/transitions and keeps nonmoving press feedback using brightness 0.9. Main entry animation is 230ms ease-out and also respects reduced motion.

## Shapes

Use 2px outlines for common panels, controls and fields. Panels are 16px rounded rectangles, buttons 11px, fields 10px, dialogs 22px desktop and 23px upper corners mobile. Chips are pills; avatar and icon containers use their local component radii. Dashed separators and upload boundaries keep the paper-tool character.

## Components

### Buttons and fields

Controls feel tactile and confident. Standard buttons use cream paper, a 2px border and hard shadow; primary buttons invert ink/paper, while accent actions use the amber class. On mobile the final cascade gives principal buttons, chips, icon controls, calendar arrows, close controls, menu controls and form input/select controls a **48px minimum height**; icons become 48px square. Menu rows are at least 52px high, upload controls 64px. Text-only actions retain a separate 44px minimum; do not describe every interactive element as 48px square. Calendar cells keep their seven-column geometry and at least 65px height.

Inputs use the paper fill, 2px ink border and 11px 13px padding. Multiline fields have at least 80px height. Disabled buttons use 0.55 opacity and a not-allowed cursor. Keyboard focus is a 3px ink outline with 4px offset on buttons, links and fields. Native labels, localized accessible icon names and selected-state attributes supplement visual states.

### Navigation and menu

Selected navigation uses amber and a hard outline. Mobile bottom navigation preserves icons plus short text labels; the central add action is raised. Menu opens a scrollable bottom sheet with locale pills, blue soundscape panel and two-column navigation. Soundscape is locally generated audio, activated by user interaction; sound and haptics are optional enhancements, not the sole press feedback.

### Calendar and localization

Weekdays use localized short forms. The main date is prominent; secondary lunar day numerals are 11px on mobile with inherited ink and 0.7 opacity, rather than hardcoded dark text on night surfaces. Locale feeds Intl formatting and document language. Lunar labels follow the selected locale; the implementation uses the Intl Chinese calendar and is not a separately validated Vietnamese astronomical calendar.

### Asset provenance and delivery evidence

The visual authority is the supplied Screenshot 2026-11-25 195928.png, recorded in the surface contract. Icons come from the installed lucide-react package. The default avatar is an icon; photos and recordings are supplied by the user. No generated stock illustration or remote photography is required by this visual system.

Finish review disposition: **ship for the requested touch-target, lunar readability/locale, and EN/FR/ZH layout fixes**, scoped to code and browser evidence. Reference captures: `qa/desktop-today.png`, `qa/mobile-today.png`, `qa/mobile-neon-calendar-final.png`, `qa/mobile-menu-fr.png`, `qa/mobile-form-zh.png`, plus locale menu/form/settings captures. Physical Android device behavior, vibration, keyboard/safe-area interactions and device CJK fonts remain **unverified**; this is not store-readiness certification. The documenter inspected the listed desktop, neon calendar, French menu and Chinese form captures directly. Separate final verification reports 8 browser tests passed with 0 failed, a passing build and 14 domain tests, npm audit with 0 vulnerabilities, verified APK v2/v3 signatures and byte-for-byte matches for all 29 bundled assets. The earlier 7-pass/1-unexpected browser report was superseded after extending the 31-module traversal test timeout to 90 seconds; no app test was disabled. These checks complement the narrow visual review and do not establish physical Android behavior. Additional media/offline script verification was still completing when this documentation was refreshed.

## Do's and Don'ts

### Do:

- **Do** retain the screenshot's peach/cream default, oversized amber clock, outlined panels and hard shadows.
- **Do** reuse the seven live CSS slots and all 24 selectable palettes.
- **Do** retain visible press and keyboard focus feedback with reduced-motion alternatives.
- **Do** test translated layouts at phone widths and allow wrapping and sheet scrolling.
- **Do** distinguish browser verification from actual Android hardware validation.

### Don't:

- **Don't** replace structural shadows with diffuse decorative card glows.
- **Don't** reintroduce smaller mobile icon buttons through later CSS overrides.
- **Don't** hardcode dark calendar text on night surfaces or make locale formatting independent of persisted locale.
- **Don't** claim bundled Chinese typography, a validated Vietnamese lunar algorithm or physical-device testing that the implementation does not establish.
