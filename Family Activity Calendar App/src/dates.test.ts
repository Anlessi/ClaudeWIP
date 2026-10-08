import assert from "node:assert/strict"
import { test } from "node:test"
import {
  addDays,
  forecastWindow,
  formatWeekRange,
  localIsoDate,
  mondayOf,
  msUntilNextMidnight,
  weekOf,
  weekdayIndex,
} from "./dates.ts"

test("addDays crosses month and year ends", () => {
  assert.equal(addDays("2026-10-05", 6), "2026-10-11")
  assert.equal(addDays("2026-10-30", 3), "2026-11-02")
  assert.equal(addDays("2026-12-30", 3), "2027-01-02")
  assert.equal(addDays("2026-03-01", -1), "2026-02-28")
  assert.equal(addDays("2028-03-01", -1), "2028-02-29")
})

test("localIsoDate uses the device's calendar date, not the UTC date", () => {
  assert.equal(localIsoDate(new Date(2026, 9, 6, 23, 59, 59)), "2026-10-06")
  assert.equal(localIsoDate(new Date(2026, 9, 6, 0, 0, 0)), "2026-10-06")
  assert.equal(localIsoDate(new Date(2026, 0, 1, 0, 30)), "2026-01-01")
  assert.equal(localIsoDate(new Date(2026, 11, 31, 23, 30)), "2026-12-31")
})

test("weeks run Monday to Sunday", () => {
  assert.equal(weekdayIndex("2026-10-05"), 0)
  assert.equal(weekdayIndex("2026-10-06"), 1)
  assert.equal(weekdayIndex("2026-10-11"), 6)

  assert.equal(mondayOf("2026-10-05"), "2026-10-05")
  assert.equal(mondayOf("2026-10-11"), "2026-10-05")
  assert.equal(mondayOf("2026-10-12"), "2026-10-12")
  assert.equal(mondayOf("2027-01-01"), "2026-12-28")

  assert.deepEqual(weekOf("2026-10-08"), [
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
    "2026-10-10",
    "2026-10-11",
  ])
})

test("forecastWindow covers this week and next, never more than 13 days ahead", () => {
  const window = forecastWindow("2026-10-06")
  assert.equal(window.length, 14)
  assert.equal(window[0], "2026-10-05")
  assert.equal(window[13], "2026-10-18")

  // Worst case is a Monday (the window then ends 13 days later); a Sunday looks back 6 days.
  assert.equal(forecastWindow("2026-10-05")[13], addDays("2026-10-05", 13))
  assert.equal(forecastWindow("2026-10-11")[0], addDays("2026-10-11", -6))
  for (let offset = 0; offset < 14; offset++) {
    const today = addDays("2026-10-05", offset)
    const last = forecastWindow(today)[13]
    assert.ok(last <= addDays(today, 13), `${today} -> ${last}`)
    assert.ok(forecastWindow(today)[0] >= addDays(today, -6))
  }
})

test("formatWeekRange", () => {
  assert.equal(formatWeekRange(weekOf("2026-10-06")), "5–11 October 2026")
  assert.equal(
    formatWeekRange(weekOf("2026-09-30")),
    "28 September – 4 October 2026",
  )
  assert.equal(
    formatWeekRange(weekOf("2027-01-01")),
    "28 December 2026 – 3 January 2027",
  )
})

test("formatWeekRange short", () => {
  // A week within one month is already short enough.
  assert.equal(formatWeekRange(weekOf("2026-10-14"), true), "12–18 October 2026")
  assert.equal(formatWeekRange(weekOf("2026-09-30"), true), "28 Sep – 4 Oct 2026")
  assert.equal(formatWeekRange(weekOf("2027-01-01"), true), "28 Dec – 3 Jan 2027")
})

test("msUntilNextMidnight points just past the next local midnight", () => {
  const evening = new Date(2026, 9, 6, 23, 59, 0)
  assert.equal(msUntilNextMidnight(evening), 61_000)

  const noon = new Date(2026, 9, 6, 12, 0, 0)
  const next = new Date(noon.getTime() + msUntilNextMidnight(noon))
  assert.equal(localIsoDate(next), "2026-10-07")
  assert.equal(next.getHours(), 0)
})
