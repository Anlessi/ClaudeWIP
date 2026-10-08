# 0019: Overlapping events show as one card with "+N"; every card opens its details

- **Status:** Accepted (2026-10-08)
- **Links:** this pull request, 0011, `src/events.ts` (`groupOverlaps`, `cardLayout`), `src/EventDialog.tsx`, `src/App.tsx` (`EventCard`)

## Context
Overlapping events were drawn side by side, which made each card too narrow to read, especially in the Week
view on a phone. Separately, titles were sometimes cut through a row with the start time drawn over them: the
title could take 4 rows even in cards too short for that, and the browser squeezed it.

## Decision
- Events that overlap, including chains (A overlaps B, B overlaps C), form one group shown as **one card**.
- The card shows the **earliest** event (the longer one when two start together) and covers the **whole
  group's time**, so no busy time looks free.
- A "+N" chip next to the start time counts the other events. It uses the card's colours swapped (solid, bold)
  so it can't be missed.
- **Every** card is a button that opens a read-only details window listing each event in the group with its
  time, calendar and note. This replaces "non-clickable cards" in 0011; there is still no adding or editing.
- The same in the Week and Day views.
- Titles show only the whole rows that fit above the time (`cardLayout` in `events.ts`, which mirrors the card
  sizes in `index.css`). Cards too short for that put the time on the title's row. A note shows only when the
  title still gets 2 rows.

## Alternatives considered
- **Keep side-by-side cards:** too narrow to read, which is why this changed.
- **Card only as long as the shown event:** rejected by the owner; the hidden events' time would look free.
- **Show the longest event:** the earliest is easier to follow down the day.
- **Only cards with "+N" clickable:** inconsistent, and hover tooltips don't work on phones.
- **Keep side-by-side in the wider Day view:** one behaviour in both views is simpler.

## Consequences
- Hidden events are only seen in the details window (or the hover tooltip).
- When the card's CSS sizes change (padding, font size, line height, the "+N" chip), update `CARD_SIZES` and
  `MORE_ROW` in `events.ts` too, or titles may again be cut or covered.
