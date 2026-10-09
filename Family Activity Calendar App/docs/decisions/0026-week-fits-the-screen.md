# 0026: The week fits the screen on landscape tablets and laptops; a slimmer hour column

- **Status:** Accepted (2026-10-09)
- **Links:** this pull request, 0023 (phone sizes), 0024 (hour readings); `src/index.css` (`.days-grid--week`,
  `.time-column`, `.time-label`, `.time-heading`, `.time-allday`, phone block)

## Context
On the owner's tablet in landscape (about 1280px wide), Sunday was cut off halfway. Each day had a minimum width
of 10.7rem (171px) and the week a minimum of 74.9rem, so it needed about 1270px plus the page margins. The hour
column was 4.4rem (70px) with the times aligned to the right, although "07:00" needs only about 30px.

## Decision
- **Days share the width:** `repeat(7, minmax(8.75rem, 1fr))`, with no minimum for the whole week. The week fits on
  screens about 1110px or wider: the owner's tablet (163px per day), larger tablets in landscape and laptops. One rule
  for every screen above the phone size (the owner chose to include laptops and desktops).
- **The floor is 8.75rem (140px)** because each hour's weather and price must fit before the event cards, which start at
  47% of the day (0024). A 140px day leaves 54px, enough for a winter reading like "−12°" or a negative price
  "−0.3" (about 55px). At 120px, 56 cells overflowed in the browser check.
- **Narrower screens scroll sideways** as before: a tablet held upright (owner's choice), and an iPad in landscape at
  1024px (about 90px too wide). Upright, the days are now 140px instead of 171px.
- **Phones are unchanged:** the phone block keeps `minmax(10.7rem, 1fr)` days and the 60rem week (0023).
- **Hour column:** 3rem (48px) on every screen (was 4.4rem, 3.6rem on phones). The times, the time zone ("GMT+3") and
  "All day" are left-aligned with 0.5rem of padding.

## Alternatives considered
- **Fit the week when a tablet is upright too:** about 100px per day, too cramped for the readings and the cards.
- **Tablets only, laptops unchanged:** a 1280px laptop window had the same cut-off Sunday, so one rule is simpler.
- **A lower floor (7.5rem) so 1024px iPads fit:** readings overflow into the event-card area in narrow days.

## Consequences
- If the hour readings grow wider, raise the floor (or the week will overlap cards on narrow screens).
- If the hour column holds longer text (for example a longer time zone label), check it still fits in 3rem.
