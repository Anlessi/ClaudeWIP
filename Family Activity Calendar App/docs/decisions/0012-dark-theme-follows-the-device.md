# 0012: Dark theme follows the device setting, and the install icon is dark

- **Status:** Accepted (2026-10-07)
- **Links:** this pull request, 0009, 0010 (the white icon part is replaced), `src/index.css`, `public/icon.svg`

## Context
The owner made a dark theme, contrast fixes and a transparent WG logo in the "Week at a Glance" design system and
asked for them to be built into the app. Two questions followed: how the theme is chosen, and what the install
icon should look like, since an icon can't change with the theme.

## Decision
- **Theme:** the colours are CSS variables in `:root` in `src/index.css`, and a
  `@media (prefers-color-scheme: dark)` block holds the dark values. The app follows the device setting. There is
  no switch. Values come from the design system's tokens.
- **Contrast fixes** from the design system are applied (`muted`, `time-heading`, `weather-text`, `price-high`,
  the input border and a solid focus ring).
- **Logo:** the transparent mark (`src/assets/logo-transparent.png`) is used in the top bar and on the PIN card,
  in both themes.
- **Install icon:** always the dark version: the mark on the dark canvas colour (`#0f1613`) in
  `public/icon.svg`. The manifest `theme_color` and `background_color` and the icon background in
  `pwa-assets.config.ts` use the same colour.
- Event cards keep each Google calendar's own colour in both themes (0009).

## Alternatives considered
- **A manual light/dark switch:** more UI and a saved setting, and not asked for. It can be added later on top of
  the variables.
- **A light icon, or two icons:** the manifest can't switch icons by theme, so one has to be chosen. The owner chose dark.

## Consequences
- Phones that installed the app earlier keep the old white icon until it is reinstalled.
- New colours must be added as variables with both a light and a dark value, never written directly in a rule.
- `src/assets/logo.png` (white background) is no longer used by the app.
