/** How far (in pixels) a finger must move sideways before it counts as a swipe. */
export const SWIPE_DISTANCE = 60

/** Touches starting this close (in pixels) to the screen's side are left to the browser's own back gesture. */
export const SWIPE_EDGE = 24

/**
 * Which way a finger movement changes the day: 1 for the next day (a swipe to the left), -1 for the previous
 * day (a swipe to the right) and 0 for anything else. Only a clearly sideways movement counts, so scrolling
 * up and down and taps never change the day.
 */
export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < 2 * Math.abs(dy)) return 0
  return dx < 0 ? 1 : -1
}
