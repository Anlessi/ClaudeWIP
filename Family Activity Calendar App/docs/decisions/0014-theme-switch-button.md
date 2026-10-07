# 0014: A light/dark switch button in the top bar

- **Status:** Accepted (2026-10-07)
- **Links:** this pull request, 0012 (its "no switch" part is replaced), `src/theme.ts`, `src/App.tsx` (`ThemeToggle`)

## Context
0012 made the dark theme follow the device setting and left a manual switch for later. The owner asked for a
button to swap between dark and light mode.

## Decision
- A round sun/moon button in the top bar, next to the Day/Week switcher, flips between light and dark.
- The choice is saved in `localStorage` under `familyflow.theme` (`light` or `dark`).
- Until the button is used, the app follows the device setting, including when it changes.
- The dark values are now in `:root[data-theme="dark"]` in `index.css` instead of a `prefers-color-scheme` block.
  `theme.ts` sets `data-theme` on `<html>`, and a small script in `index.html` sets it before the first paint so
  there is no flash.

## Alternatives considered
- **Three choices (light, dark, follow device):** more UI than asked for. Following the device is the default until the button is used.
- **Keeping the `prefers-color-scheme` block and adding a second copy for the override:** duplicates about 45 variables.

## Consequences
- There is no way back to "follow the device" once a choice is saved, except clearing site data.
- New colours still need a light and a dark value (0012).
