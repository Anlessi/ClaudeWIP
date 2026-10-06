import assert from "node:assert/strict"
import { test } from "node:test"
import { layoutLanes } from "./events.ts"

test("layoutLanes gives lone events the whole width", () => {
  assert.deepEqual(
    layoutLanes([
      { start: 9, duration: 1 },
      { start: 10, duration: 1 },
    ]),
    [
      { lane: 0, lanes: 1 },
      { lane: 0, lanes: 1 },
    ],
  )
})

test("layoutLanes puts overlapping events side by side", () => {
  assert.deepEqual(
    layoutLanes([
      { start: 17, duration: 2 },
      { start: 17.5, duration: 0.5 },
      { start: 18, duration: 1 },
    ]),
    [
      { lane: 0, lanes: 2 },
      { lane: 1, lanes: 2 },
      { lane: 1, lanes: 2 },
    ],
  )
})

test("layoutLanes keeps separate clusters separate and handles any input order", () => {
  const lanes = layoutLanes([
    { start: 14, duration: 1 },
    { start: 9, duration: 2 },
    { start: 9, duration: 1 },
    { start: 9.5, duration: 1 },
  ])
  assert.deepEqual(lanes[0], { lane: 0, lanes: 1 })
  assert.deepEqual(lanes[1], { lane: 0, lanes: 3 })
  assert.deepEqual(lanes[2], { lane: 1, lanes: 3 })
  assert.deepEqual(lanes[3], { lane: 2, lanes: 3 })
})
