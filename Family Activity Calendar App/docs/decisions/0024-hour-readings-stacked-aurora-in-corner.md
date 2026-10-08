# 0024: Weather and price always on two lines; the aurora badge in the top-right corner

- **Status:** Accepted (2026-10-08)
- **Links:** this pull request, 0013 (northern lights), 0023 (48px hour rows on phones); `src/App.tsx`, `src/index.css` (`.cell-data`, `.cell-aurora`)

## Context
Each hour cell showed weather, price and the northern-lights badge in a row that wrapped when it ran out of room.
A two-digit temperature ("10°") was just wide enough to push the price onto a second line, so neighbouring hours
looked different, and the result changed with screen width. Stacking all three would need about 59px, but an hour
row on phones is 48px (0023).

## Decision
- The weather and the price are always stacked, one per line, on every screen size (`.cell-data` is a column).
- The northern-lights badge is no longer in that stack. It sits in the hour cell's top-right corner, in the event
  area, in front of any event card (`.cell-aurora`, z-index 6 against the cards' 5). The owner's reasoning: aurora
  hours are dark night hours, when there are seldom events.

## Alternatives considered
- **Keep one line and let it wrap:** the cause of the problem; one line can't fit in narrow Week columns.
- **Three lines everywhere:** the badge spills about 11px into the next hour on phones.
- **Icon-only badge beside the temperature on phones:** looks different on phones and on bigger screens.
- **Hide the badge in hour cells on phones:** loses the hourly aurora information.
- **Make event cards narrower beside the badge:** the owner suggested it as an option; drawing the badge in
  front is much simpler and enough while night events are rare.

## Consequences
- An event at night in an aurora hour has a small part of its top-right corner covered by the badge.
- If more readings are added to hour cells, phones have room for only two lines in a 48px row.
