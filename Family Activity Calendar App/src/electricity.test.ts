import assert from "node:assert/strict"
import { test } from "node:test"
import {
  HIGH_PRICE,
  LOW_PRICE,
  formatPrice,
  loadCachedPrices,
  parsePrices,
  priceLevel,
  priceRange,
  saveCachedPrices,
} from "./electricity.ts"

const HELSINKI = "Europe/Helsinki"

function fakeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}

test("parsePrices groups the hourly prices by local date and hour", () => {
  const table = parsePrices(
    {
      prices: [
        // Helsinki is UTC+3 in summer time: 21:00 UTC is midnight on the next date.
        { date: "2026-10-05T21:00:00.000Z", value: 0 },
        { date: "2026-10-05T22:00:00.000Z", value: -0.005 },
        { date: "2026-10-06T04:00:00.000Z", value: 4.373 },
        { date: "2026-10-06T17:00:00.000Z", value: 12.5 },
        { date: "2026-10-06T20:00:00.000Z", value: 3.1 },
        { date: "2026-10-06T21:00:00.000Z", value: 2 },
      ],
    },
    1234,
    HELSINKI,
  )

  assert.equal(table.fetchedAt, 1234)
  assert.deepEqual(table.byDate["2026-10-06"], {
    0: 0,
    1: -0.005,
    7: 4.373,
    20: 12.5,
    23: 3.1,
  })
  assert.deepEqual(table.byDate["2026-10-07"], { 0: 2 })
  assert.equal(table.byDate["2026-10-05"], undefined)
})

test("parsePrices uses winter time in winter and ignores unusable entries", () => {
  const table = parsePrices(
    {
      prices: [
        // Helsinki is UTC+2 in winter time.
        { date: "2026-12-31T22:00:00.000Z", value: 7 },
        { date: "not a date", value: 1 },
        { date: "2026-12-31T23:00:00.000Z", value: "5" },
        { date: 5, value: 5 },
        { date: "2026-12-31T23:00:00.000Z", value: Number.NaN },
      ],
    },
    0,
    HELSINKI,
  )
  assert.deepEqual(table.byDate, { "2027-01-01": { 0: 7 } })
})

test("parsePrices averages an hour that occurs twice when clocks go back", () => {
  // 25 October 2026: at 04:00 summer time clocks go back to 03:00, so 03:00-04:00 happens twice.
  const table = parsePrices(
    {
      prices: [
        { date: "2026-10-25T00:00:00.000Z", value: 2 },
        { date: "2026-10-25T01:00:00.000Z", value: 6 },
      ],
    },
    0,
    HELSINKI,
  )
  assert.deepEqual(table.byDate["2026-10-25"], { 3: 4 })
})

test("parsePrices rejects answers it cannot understand", () => {
  assert.throws(() => parsePrices({}, 0), /Unexpected response/)
  assert.throws(() => parsePrices(null, 0), /Unexpected response/)
  assert.throws(() => parsePrices({ prices: "x" }, 0), /Unexpected response/)
  assert.deepEqual(parsePrices({ prices: [] }, 5).byDate, {})
})

test("priceRange runs from local midnight to local midnight after the last date", () => {
  const { start, end } = priceRange("2026-10-05", "2026-10-18")
  const first = new Date(start)
  const last = new Date(end)
  assert.deepEqual(
    [first.getFullYear(), first.getMonth(), first.getDate(), first.getHours()],
    [2026, 9, 5, 0],
  )
  assert.deepEqual(
    [last.getFullYear(), last.getMonth(), last.getDate(), last.getHours()],
    [2026, 9, 19, 0],
  )
  assert.equal(start, first.toISOString())
})

test("formatPrice shows a decimal for small prices and none from ten cents", () => {
  assert.equal(formatPrice(4.373), "4.4")
  assert.equal(formatPrice(0), "0.0")
  assert.equal(formatPrice(-0.004), "0.0")
  assert.equal(formatPrice(-1.26), "-1.3")
  assert.equal(formatPrice(9.96), "10")
  assert.equal(formatPrice(12.5), "13")
  assert.equal(formatPrice(43.445), "43")
})

test("priceLevel marks low and high prices", () => {
  assert.equal(priceLevel(LOW_PRICE), "low")
  assert.equal(priceLevel(-2), "low")
  assert.equal(priceLevel(LOW_PRICE + 0.1), "normal")
  assert.equal(priceLevel(HIGH_PRICE - 0.1), "normal")
  assert.equal(priceLevel(HIGH_PRICE), "high")
})

test("saved prices are only used for the same dates and a valid shape", () => {
  const storage = fakeStorage()
  const table = parsePrices(
    { prices: [{ date: "2026-10-06T04:00:00.000Z", value: 4 }] },
    9,
    HELSINKI,
  )

  assert.equal(loadCachedPrices("2026-10-05", "2026-10-18", storage), null)
  saveCachedPrices("2026-10-05", "2026-10-18", table, storage)
  assert.deepEqual(loadCachedPrices("2026-10-05", "2026-10-18", storage), table)
  assert.equal(loadCachedPrices("2026-10-12", "2026-10-25", storage), null)

  storage.setItem("familyflow.prices", "not json")
  assert.equal(loadCachedPrices("2026-10-05", "2026-10-18", storage), null)
  storage.setItem(
    "familyflow.prices",
    JSON.stringify({ key: "2026-10-05..2026-10-18", prices: { byDate: 1 } }),
  )
  assert.equal(loadCachedPrices("2026-10-05", "2026-10-18", storage), null)
  assert.equal(loadCachedPrices("2026-10-05", "2026-10-18", null), null)
})
