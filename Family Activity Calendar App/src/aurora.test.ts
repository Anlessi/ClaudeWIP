import assert from "node:assert/strict"
import { test } from "node:test"
import {
  MAX_AURORA_CLOUD,
  auroraHours,
  auroraLevel,
  formatKp,
  kpNeeded,
  loadCachedKp,
  magneticLatitude,
  parseKp,
  saveCachedKp,
} from "./aurora.ts"
import type { HourWeather } from "./weather.ts"

const HELSINKI = "Europe/Helsinki"

function fakeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}

test("magneticLatitude is lower than the geographic latitude in Finland", () => {
  const helsinki = magneticLatitude(60.17, 24.94)
  assert.ok(helsinki > 56 && helsinki < 59, String(helsinki))
  // The magnetic pole is on the Canadian side, so the same latitude is "further north" there.
  assert.ok(magneticLatitude(60, -100) > magneticLatitude(60, 25))
})

test("kpNeeded follows the usual Finnish rules of thumb", () => {
  assert.equal(kpNeeded(67.42, 26.59), 1) // Sodankylä
  assert.equal(kpNeeded(66.5, 25.73), 1) // Rovaniemi
  assert.equal(kpNeeded(65.01, 25.47), 2) // Oulu
  assert.equal(kpNeeded(62.24, 25.75), 3) // Jyväskylä
  assert.equal(kpNeeded(60.17, 24.94), 4) // Helsinki
  assert.equal(kpNeeded(78.22, 15.65), 1) // Svalbard: never below 1
  assert.notEqual(kpNeeded(-46.41, 168.35), null) // Invercargill: southern lights in strong storms
  assert.equal(kpNeeded(40.42, -3.7), null) // Madrid: almost never
})

test("parseKp spreads each UTC slot over three local hours and keeps only the forecast", () => {
  const table = parseKp(
    [
      { time_tag: "2026-10-06T21:00:00", kp: 9, observed: "observed" },
      { time_tag: "2026-10-07T15:00:00", kp: 2.67, observed: "estimated" },
      // Helsinki is UTC+3 in summer time: 21:00 UTC is midnight on the next date.
      { time_tag: "2026-10-08T18:00:00", kp: 5.67, observed: "predicted" },
      { time_tag: "2026-10-08T21:00:00", kp: 4, observed: "predicted" },
      { time_tag: "not a date", kp: 1, observed: "predicted" },
      { time_tag: "2026-10-09T00:00:00", kp: "5", observed: "predicted" },
      null,
    ],
    7,
    HELSINKI,
  )

  assert.equal(table.fetchedAt, 7)
  assert.deepEqual(table.byDate["2026-10-07"], { 18: 2.67, 19: 2.67, 20: 2.67 })
  assert.deepEqual(table.byDate["2026-10-08"], { 21: 5.67, 22: 5.67, 23: 5.67 })
  assert.deepEqual(table.byDate["2026-10-09"], { 0: 4, 1: 4, 2: 4 })
  assert.equal(table.byDate["2026-10-06"], undefined)
})

test("parseKp keeps the higher value for the hour that occurs twice when clocks go back", () => {
  // 25 October 2026: at 04:00 summer time clocks go back to 03:00, so 03:00-04:00 happens twice.
  const table = parseKp(
    [
      { time_tag: "2026-10-24T21:00:00", kp: 3, observed: "predicted" },
      { time_tag: "2026-10-25T00:00:00", kp: 6, observed: "predicted" },
    ],
    0,
    HELSINKI,
  )
  assert.deepEqual(table.byDate["2026-10-25"], {
    0: 3,
    1: 3,
    2: 3,
    3: 6,
    4: 6,
  })
})

test("parseKp rejects answers it cannot understand", () => {
  assert.throws(() => parseKp({}, 0), /Unexpected response/)
  assert.throws(() => parseKp(null, 0), /Unexpected response/)
  assert.deepEqual(parseKp([], 5).byDate, {})
})

function hour(night: boolean, cloud?: number): HourWeather {
  return { kind: "cloudy", temp: 0, night, cloud }
}

test("auroraHours needs enough activity, darkness and a clear enough sky", () => {
  const kp = { 17: 6, 19: 3.67, 20: 4, 21: 4, 22: 3.33, 23: 5 }
  const weather = {
    17: hour(false, 0), // daylight
    19: hour(true, 0), // "4-" counts as Kp 4
    20: hour(true, MAX_AURORA_CLOUD), // just clear enough
    21: hour(true, MAX_AURORA_CLOUD + 1), // too cloudy
    22: hour(true, 0), // too little activity ("3+")
    23: hour(true), // saved forecast without cloud cover
  }
  assert.deepEqual(
    [...auroraHours(kp, weather, 4)],
    [
      [19, 3.67],
      [20, 4],
    ],
  )
  assert.deepEqual([...auroraHours(kp, weather, null)], [])
  assert.deepEqual([...auroraHours(undefined, weather, 1)], [])
  assert.deepEqual([...auroraHours(kp, undefined, 1)], [])
})

test("auroraLevel puts whole Kp 0-2 as low, 3-4 as moderate and 5-9 as high", () => {
  assert.equal(auroraLevel(0), "low")
  assert.equal(auroraLevel(2.33), "low")
  assert.equal(auroraLevel(2.67), "moderate")
  assert.equal(auroraLevel(4.33), "moderate")
  assert.equal(auroraLevel(4.67), "high")
  assert.equal(auroraLevel(9), "high")
})

test("formatKp shows at most one decimal", () => {
  assert.equal(formatKp(5), "5")
  assert.equal(formatKp(5.67), "5.7")
  assert.equal(formatKp(4.33), "4.3")
})

test("the saved forecast is only used when it has a valid shape", () => {
  const storage = fakeStorage()
  const table = parseKp(
    [{ time_tag: "2026-10-08T18:00:00", kp: 5, observed: "predicted" }],
    9,
    HELSINKI,
  )

  assert.equal(loadCachedKp(storage), null)
  saveCachedKp(table, storage)
  assert.deepEqual(loadCachedKp(storage), table)

  storage.setItem("familyflow.aurora", "not json")
  assert.equal(loadCachedKp(storage), null)
  storage.setItem("familyflow.aurora", JSON.stringify({ byDate: 1 }))
  assert.equal(loadCachedKp(storage), null)
  assert.equal(loadCachedKp(null), null)
})
