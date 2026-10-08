# 0020: A compact header: one-line date, filters and legend collapsed

- **Status:** Accepted (2026-10-08)
- **Links:** this pull request, 0009, `src/App.tsx` (calendar header and legend), `src/dates.ts` (`formatWeekRange`), `src/index.css`

## Context
On a phone, the date heading, the five filter buttons (location, Weather, Electricity, Northern lights,
calendar) and the legend filled most of the screen before the calendar started. The date also wrapped onto two
lines for longer labels such as "12–18 October 2026".

## Decision
- **On every screen size**, the date sits on one row with ‹ Today › and a **Filters** button, at a smaller size.
- **Filters** opens a collapsing panel below the header with the same buttons (it pushes the calendar down).
  On phones the button shows only its icons; its accessible name stays "Filters".
- The **legend** is a slim "Legend" line at the top of the calendar that expands to the full legend.
- Both panels **always start closed** when the app opens. Their state is not saved.
- **The date never wraps** (`white-space: nowrap`). On phones (≤600px) the text scales with the screen
  (`min(1rem, 4.1vw)`), a week across two months uses short month names and only the last year
  ("28 Dec – 3 Jan 2027", `formatWeekRange(weekDates, true)`), and the Day view uses a short month
  ("Sun, Nov 1 2026"). Wider screens keep the full names. Both labels are in the page and CSS shows one
  (`.date-long`, `.date-short`).

## Alternatives considered
- **Filters in a pop-up dialog:** a collapsing panel is simpler and the calendar stays visible while toggling.
- **Compact header on phones only:** the owner wanted the same header everywhere.
- **Remember whether the panels were left open:** "closed by default" is simpler and was preferred.
- **Only make the date smaller:** weeks across two months would need about 10–11px text to fit, too small.
- **Short months on phones for every week:** less friendly; same-month weeks already fit with the full name.

## Consequences
- Checked for a full year of days and weeks at 360px and 375px wide; the tightest is "16–22 November 2026"
  at 360px with 10px to spare. Phones narrower than about 340px may still see a long label touch the buttons.
- If buttons are added to the header row, recheck that the longest labels still fit on a 360px phone.
