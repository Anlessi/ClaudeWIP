# 0028: Swipe left or right to change the day in the Day view

- **Status:** Accepted (2026-10-09)
- **Links:** this pull request, 0027 (week scrolls to today); `src/swipe.ts`, `src/App.tsx` (`startSwipe`,
  `endSwipe`, `slideFrom`), `src/index.css` (`day-from-next`, `day-from-prev`)

## Context
In the Day view the only way to change the day was the ‹ › arrows at the top, so on a phone you had to scroll back
up after reading a day. The owner wanted to swipe sideways on the calendar instead, keeping the arrows.

## Decision
- In the **Day view only**, a swipe on the calendar to the left goes to the next day and to the right the previous
  day. The arrows stay.
- A swipe counts only when the finger moves at least 60px sideways and at least twice as far sideways as up or
  down (`swipeDirection` in `swipe.ts`, tested), so scrolling and taps never change the day.
- Touches starting within 24px of the screen's side are ignored, leaving the browser's own "back" edge swipe alone.
  Pinches (two fingers) are ignored. Mouse dragging does nothing; desktop uses the arrows.
- If the day is wider than the screen, the frame first scrolls sideways and the day changes only once it is at that end.
- The new day slides in from the side it comes from (about 0.2 s, with a fade), for swipes and for the arrows.
  It is off when the device asks for reduced motion. Today, switching views and tapping a day don't slide.

## Alternatives considered
- **The day follows the finger and snaps** (like a photo gallery): feels the most natural, but much more work and
  testing; the owner chose the short slide.
- **Instant switch, no slide:** simplest, but it's less clear that the day changed.
- **Swiping in the Week view too:** the week already scrolls sideways on phones (0027), so a swipe there stays a scroll.

## Consequences
- Touch handlers are on the `schedule-frame` section and are passive, so they never block scrolling.
- The slide relies on the day column being keyed by its date (`key={day.iso}`), so a new day mounts and animates.
