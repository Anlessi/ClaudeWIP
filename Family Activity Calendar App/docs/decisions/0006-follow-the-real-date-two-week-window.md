# 0006: Follow the real date, with data for this week and next week

- **Status:** Accepted (2026-10-06)
- **Links:** Anlessi/ClaudeWIP#8, `src/dates.ts`, `src/useToday.ts`

## Context
The export was fixed to the week of 5–11 October 2026, and "Today" followed the selected day instead of the real
date. The owner asked for weather for the current week and at least the next one.

## Decision
- The calendar follows the device's local date. Weeks run **Monday to Sunday**. In week view the arrows move by
  a week, and in day view by a day. "Today" always marks the real date, updating at midnight and when the app
  comes back into view.
- External data is requested as **one window: Monday of this week to Sunday of next week** (14 days), never more
  than 13 days ahead (Open-Meteo allows 15). The electricity prices use the same window.
- Days outside the window show no data, and the line under the calendar says so.
- Events are stored per date. Sample events are placed in the current week when the app opens.

## Alternatives considered
- **A request per visible week:** more requests, and later weeks have no forecast anyway.

## Consequences
- Saved copies in `localStorage` are only used if they match the requested dates and shape. Older or damaged
  data is ignored.
