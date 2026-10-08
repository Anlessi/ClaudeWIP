# 0021: The location button is in the top bar

- **Status:** Accepted (2026-10-08)
- **Links:** this pull request, 0020, 0005, `src/App.tsx` (top bar), `src/index.css` (`.topbar-location`)

## Context
0020 put the location button inside the collapsed Filters panel, so changing the place took two taps and the
current place was hidden. The owner wanted it in the top bar, between the Day/Week switch and the light/dark
button. On a 360px phone the top bar was already full: the logo and title needed about 160px and the switch
and theme button about 197px, out of 336px.

## Decision
- The location button (pin + place name, or "Set location") sits in the top bar between Day/Week and the
  theme button on every screen size. It is no longer in the Filters panel.
- **Tablet and desktop** keep their sizes and the "Week at a Glance" title. The name shows up to 13rem.
- **Phones (≤600px):** the title text is hidden visually (screen readers still read it) and only the WG logo
  shows. The Day/Week switch, the theme button and the gaps are smaller, and the location button is at most
  9.5rem wide. Long names end with "…".

## Alternatives considered
- **Keep the title on phones, show only a pin icon:** the place name would only be visible in the dialog.
- **Keep the title on phones with a very short name:** only about 50px for the name, so most names would be cut to "Hel…".
- **Smaller switch and spacing on every screen size:** wider screens have room, so they keep the original sizes.

## Consequences
- Checked at 360px: the row fits with about 50px to spare, and a long name truncates without page overflow.
- If more buttons are added to the top bar, recheck a 360px phone.
