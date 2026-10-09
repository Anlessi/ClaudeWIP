# 0029: One-row Day heading on phones, a deep green "today" in dark mode, full weekday names

- **Status:** Accepted (2026-10-09)
- **Links:** this pull request; 0012 (dark theme), 0023 (compact phone rows); `src/index.css`, `src/App.tsx`, `src/dates.ts`

## Context
On a phone the Day view heading took two rows (4.5rem) of a small screen. In dark mode today's heading used
`--ink` as its background, which is near-white there and glared. The Day view also showed "Fri" although the
single column has room for "Friday".

## Decision
- On phones (≤600px), the Day view heading is one 2.75rem row: name, date, Today pill, then the weather on the
  right (cut off with "…" when long). The hour column's heading (`.schedule-frame--day .time-heading`) has the same
  height so the hours line up. Larger screens and the Week view keep the 4.5rem two-row heading.
- Today's heading has its own colour tokens: `--today`, `--on-today`, `--on-today-muted`, `--today-frame` and
  `--today-pill`. Light mode keeps the old look (dark ink). Dark mode uses a deep green `#1f4d39` with light text,
  in both views; the Week view frame is the lighter green `#3f7058` so it still shows, and the Today pill inside
  the heading is dark so it doesn't vanish into the green.
- The Day view (heading and the date line at the top) uses full weekday names (`WEEKDAY_FULL_NAMES`). The Week
  view keeps the short names because its columns are narrow.

## Alternatives considered
- **Softer colour in the Day view only:** the owner wanted today to look the same in both views.
- **A dim grey-green, or only a green line under the heading:** the owner chose the deep green, which still
  stands out from other days.
- **Full names in the heading only:** the owner wanted the top date line to match.

## Consequences
- "Wednesday, Sep 30 2026" fits next to the header buttons at 360px; if the header gains buttons, check it again.
- Anything new tied to today should use the `--today*` tokens, not `--ink`.
