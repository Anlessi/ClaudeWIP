# 0023: Shorter hour rows, smaller event cards and a narrower week on phones

- **Status:** Accepted (2026-10-08)
- **Links:** this pull request, 0019, `src/useIsPhone.ts`, `src/events.ts` (`HOUR_HEIGHT`, `CARD_INSET`,
  `CARD_SIZES`, `cardLayout`), `src/index.css` (phone block)

## Context
On a phone each hour row was 64px, so the day (07:00–24:00) was about 1090px tall and only about 7 hours fit on
screen. Hours without events took as much room as busy ones. The Week view was 70rem wide, so seeing the week
needed a lot of sideways scrolling.

## Decision
- **Phones only (≤600px):** every hour row is 48px (3rem) instead of 64px, and the Week view is 60rem wide
  instead of 70rem. Tablets and desktop are unchanged.
- **Smaller event cards on phones, in both views,** so a 1-hour event still shows two title rows (the owner
  asked for this): title text 0.6rem instead of 0.68rem (0.78rem in the Day view), padding 0.3rem 0.45rem, a
  0.1rem gap above the time, and 2px instead of 4px between a card and the hour lines (a 1-hour card is 44px).
- The sizes are in two places that must match: the phone `@media (max-width: 600px)` block in `index.css`, and
  `events.ts` (`HOUR_HEIGHT`, `CARD_INSET`, `CARD_SIZES.phone`), which positions the cards and works out how many
  title rows fit. `useIsPhone.ts` uses the same media query to choose between them.
- The weather and price in each cell sit a little higher with less space between them so both fit in 48px.

## Alternatives considered
- **Shrink only empty hours:** saves more on quiet days, but the time scale becomes uneven and event positions
  would need a running total of row heights. Turned down as more complex and harder to read.
- **Also on tablets (≤900px):** tablets have enough room, so they keep 64px.
- **Keep the week's width:** the owner wanted less sideways scrolling.
- **Only a smaller title font:** two rows in a 1-hour card would have needed about 6px text, so the padding and
  gap were made smaller too.

## Consequences
- About 10 hours fit on a 812px-tall phone screen instead of about 7.
- A 1-hour card on a phone has two title rows; with a "+N" chip (taller than the time) it has one.
- Checked at 375px: weather and price fit inside every cell, and the time fits inside every card.
- If the cell content grows (another reading), recheck it fits in 48px. If card sizes change in `index.css`,
  change `CARD_SIZES` too.
