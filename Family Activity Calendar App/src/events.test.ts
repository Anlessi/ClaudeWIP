import assert from "node:assert/strict"
import { test } from "node:test"
import { cardLayout, formatTime, groupOverlaps } from "./events.ts"

test("groupOverlaps keeps events that don't overlap apart", () => {
  assert.deepEqual(
    groupOverlaps([
      { start: 9, duration: 1 },
      { start: 10, duration: 1 },
    ]),
    [
      { events: [0], start: 9, end: 10 },
      { events: [1], start: 10, end: 11 },
    ],
  )
})

test("groupOverlaps puts overlapping events in one group that covers them all", () => {
  assert.deepEqual(
    groupOverlaps([
      { start: 17, duration: 1 },
      { start: 17.5, duration: 1.5 },
    ]),
    [{ events: [0, 1], start: 17, end: 19 }],
  )
})

test("groupOverlaps joins a chain of overlaps into one group", () => {
  assert.deepEqual(
    groupOverlaps([
      { start: 17, duration: 1 },
      { start: 17.5, duration: 1 },
      { start: 18.25, duration: 1 },
    ]),
    [{ events: [0, 1, 2], start: 17, end: 19.25 }],
  )
})

test("groupOverlaps shows the earliest event first, the longer one on a tie, in any input order", () => {
  assert.deepEqual(
    groupOverlaps([
      { start: 14, duration: 1 },
      { start: 9.5, duration: 1 },
      { start: 9, duration: 1 },
      { start: 9, duration: 2 },
    ]),
    [
      { events: [3, 2, 1], start: 9, end: 11 },
      { events: [0], start: 14, end: 15 },
    ],
  )
})

test("cardLayout puts the time on the title's row in short cards", () => {
  // 30 minutes: 64 px per hour minus the 8 px gap.
  assert.deepEqual(cardLayout(24, "week"), {
    titleRows: 1,
    inline: true,
    showNote: false,
  })
  assert.deepEqual(cardLayout(24, "day", { hasNote: true }), {
    titleRows: 1,
    inline: true,
    showNote: false,
  })
})

test("cardLayout gives the title only the whole rows that fit above the time", () => {
  assert.deepEqual(cardLayout(40, "week"), {
    titleRows: 1,
    inline: false,
    showNote: false,
  })
  assert.deepEqual(cardLayout(56, "week"), {
    titleRows: 2,
    inline: false,
    showNote: false,
  })
  assert.deepEqual(cardLayout(184, "week"), {
    titleRows: 4,
    inline: false,
    showNote: false,
  })
})

test("cardLayout leaves room for the taller +1 chip next to the time", () => {
  assert.equal(cardLayout(40, "week", { hasMore: true }).inline, true)
  assert.deepEqual(cardLayout(56, "week", { hasMore: true }), {
    titleRows: 2,
    inline: false,
    showNote: false,
  })
})

test("cardLayout shows the note only when the title keeps at least 2 rows", () => {
  assert.equal(cardLayout(56, "week", { hasNote: true }).showNote, false)
  assert.deepEqual(cardLayout(88, "week", { hasNote: true }), {
    titleRows: 3,
    inline: false,
    showNote: true,
  })
})

test("formatTime writes hours as hh:mm", () => {
  assert.equal(formatTime(7), "07:00")
  assert.equal(formatTime(17.25), "17:15")
})
