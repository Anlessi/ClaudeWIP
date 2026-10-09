import assert from "node:assert/strict"
import { test } from "node:test"
import { SWIPE_DISTANCE, swipeDirection } from "./swipe.ts"

test("a swipe to the left goes to the next day, to the right the previous day", () => {
  assert.equal(swipeDirection(-120, 10), 1)
  assert.equal(swipeDirection(120, -10), -1)
})

test("taps and short movements don't change the day", () => {
  assert.equal(swipeDirection(0, 0), 0)
  assert.equal(swipeDirection(-20, 3), 0)
  assert.equal(swipeDirection(SWIPE_DISTANCE - 1, 0), 0)
})

test("the swipe starts counting at exactly the swipe distance", () => {
  assert.equal(swipeDirection(-SWIPE_DISTANCE, 0), 1)
  assert.equal(swipeDirection(SWIPE_DISTANCE, 0), -1)
})

test("scrolling up and down and diagonal movements don't change the day", () => {
  assert.equal(swipeDirection(10, 300), 0)
  assert.equal(swipeDirection(-100, 80), 0)
  assert.equal(swipeDirection(100, 51), 0)
  assert.equal(swipeDirection(100, 50), -1)
})
