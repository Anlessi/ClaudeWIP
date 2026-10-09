# 0027: The Week view scrolls sideways to today

- **Status:** Accepted (2026-10-09)
- **Links:** this pull request, 0023 (phone sizes), 0026 (week fits the screen); `src/App.tsx` (`todayScroll`,
  `scheduleRef`)

## Context
On phones and tablets held upright the week is wider than the screen and scrolls sideways (0023, 0026). It always
opened at Monday, so later in the week today was off screen, and the **Today** button only changed the week without
bringing today's column into view.

## Decision
- The calendar frame scrolls sideways so **today's column sits right after the hour column**. It does this on first
  load, on **Today** (a smooth scroll, instant with reduced motion) and on switching from Day to Week.
- Switching to Week always goes to **today** (when today is in the shown week), not to a day the person picked.
- Near the end of the week the frame scrolls as far as it can (on an upright tablet Friday to Sunday all show).
- When the week fits the screen (about 1110px or wider) nothing moves, so there is no screen-size check.
- The arrows, the midnight date change and the Day view don't scroll.
- This is sideways only: scrolling down to the current hour is still not wanted.

## Alternatives considered
- **Today in the middle:** the owner preferred seeing the rest of the week ahead.
- **Switching to Week goes to the picked day:** the owner chose always today.

## Consequences
- The scroll is measured from the `.day-column--today` and `.time-column` elements; if those class names change,
  update the effect in `App.tsx`.
