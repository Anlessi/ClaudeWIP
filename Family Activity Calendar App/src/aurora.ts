// Northern lights (aurora) forecast from NOAA's Space Weather Prediction Center (https://www.swpc.noaa.gov,
// no API key needed). The service forecasts the planetary Kp index, a 0-9 measure of geomagnetic activity, for
// 3-hour UTC slots about three days ahead. Whether the lights can be seen also depends on how far north the
// place is, darkness and clouds: the last two come from the weather forecast. Plain logic with no React, so it
// can be tested.

import type { HourWeather } from "./weather"

export type KpTable = {
  /** Forecast Kp by ISO date (in the device's time zone) and hour of the day (0-23). */
  byDate: Record<string, Record<number, number>>
  fetchedAt: number
}

type RawSlot = {
  time_tag?: unknown
  kp?: unknown
  observed?: unknown
}

type SimpleStorage = Pick<Storage, "getItem" | "setItem">

const KP_URL =
  "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"
const CACHE_KEY = "familyflow.aurora"

/** Above this cloud cover (percent) the sky is too cloudy to see the lights, so the hour is not marked. */
export const MAX_AURORA_CLOUD = 60

// The geomagnetic north pole (IGRF, 2025): aurora follows magnetic, not geographic, latitude.
const POLE_LATITUDE = 80.8
const POLE_LONGITUDE = -72.6

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** The latitude of a place measured from the geomagnetic pole instead of the geographic one. */
export function magneticLatitude(latitude: number, longitude: number) {
  const lat = toRadians(latitude)
  const poleLat = toRadians(POLE_LATITUDE)
  const sine =
    Math.sin(lat) * Math.sin(poleLat) +
    Math.cos(lat) *
      Math.cos(poleLat) *
      Math.cos(toRadians(longitude - POLE_LONGITUDE))
  return (Math.asin(Math.max(-1, Math.min(1, sine))) * 180) / Math.PI
}

/**
 * The Kp needed to see the lights at a place, or null when they are almost never seen there. A rule of thumb:
 * each Kp step moves the edge of the auroral oval about 2 degrees towards the equator. It gives Kp 1 in Lapland,
 * 2 in Oulu, 3 in central Finland and 4 in Helsinki.
 */
export function kpNeeded(latitude: number, longitude: number): number | null {
  const needed = Math.round(
    (66 - Math.abs(magneticLatitude(latitude, longitude))) / 2,
  )
  if (needed > 9) return null
  return Math.max(1, needed)
}

/**
 * Turns the service's answer into Kp by local date and hour. Each 3-hour slot covers three hours. Only the
 * forecast part is kept ("estimated" for today and "predicted" ahead), not the measured past days. `timeZone`
 * defaults to the device's; it is a parameter so tests do not depend on the machine they run on.
 */
export function parseKp(
  raw: unknown,
  fetchedAt: number,
  timeZone?: string,
): KpTable {
  if (!Array.isArray(raw)) {
    throw new Error("Unexpected response from the space weather service.")
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  })

  const byDate: KpTable["byDate"] = {}
  for (const slot of raw as RawSlot[]) {
    if (
      !slot ||
      typeof slot.time_tag !== "string" ||
      typeof slot.kp !== "number" ||
      !Number.isFinite(slot.kp) ||
      (slot.observed !== "estimated" && slot.observed !== "predicted")
    ) {
      continue
    }
    // The times are UTC but written without a zone.
    const start = new Date(`${slot.time_tag.slice(0, 19)}Z`)
    if (Number.isNaN(start.getTime())) continue

    for (let offset = 0; offset < 3; offset++) {
      const time = new Date(start.getTime() + offset * 3600 * 1000)
      const part = Object.fromEntries(
        formatter.formatToParts(time).map(({ type, value }) => [type, value]),
      )
      const date = `${part.year}-${part.month}-${part.day}`
      // Some browsers report midnight as "24"; the modulo makes it 0.
      const hour = Number(part.hour) % 24
      // When clocks go back, one local hour occurs twice: keep the higher value.
      const day = (byDate[date] ??= {})
      day[hour] = Math.max(day[hour] ?? 0, slot.kp)
    }
  }
  return { byDate, fetchedAt }
}

/**
 * The hours of one day when the lights may be seen, with the forecast Kp: activity at least `needed`, dark,
 * and not too cloudy. Hours without weather (or with an old saved forecast that has no cloud cover) are left out.
 */
export function auroraHours(
  kpByHour: Record<number, number> | undefined,
  weatherByHour: Record<number, HourWeather> | undefined,
  needed: number | null,
): Map<number, number> {
  const hours = new Map<number, number>()
  if (!kpByHour || !weatherByHour || needed === null) return hours
  for (const [hour, kp] of Object.entries(kpByHour)) {
    const weather = weatherByHour[Number(hour)]
    if (
      kp >= needed &&
      weather?.night &&
      weather.cloud !== undefined &&
      weather.cloud <= MAX_AURORA_CLOUD
    ) {
      hours.set(Number(hour), kp)
    }
  }
  return new Map([...hours].sort(([a], [b]) => a - b))
}

export type AuroraLevel = "low" | "moderate" | "high"

export const AURORA_LEVEL_NAMES: Record<AuroraLevel, string> = {
  low: "Low",
  // Short, so it fits in the narrow hour cells.
  moderate: "Mid",
  high: "High",
}

/** Kp in words, rounded to whole Kp first (2.67 is "3-"): 0-2 low, 3-4 mid ("moderate"), 5-9 high. */
export function auroraLevel(kp: number): AuroraLevel {
  const rounded = Math.round(kp)
  if (rounded >= 5) return "high"
  if (rounded >= 3) return "moderate"
  return "low"
}

/** Kp shown as a whole number or with one decimal: "5", "5.7". */
export function formatKp(kp: number) {
  return String(Math.round(kp * 10) / 10)
}

/** Downloads the Kp forecast for the next three days. */
export async function fetchKp(signal?: AbortSignal): Promise<KpTable> {
  const response = await fetch(KP_URL, { signal, cache: "no-cache" })
  if (!response.ok) {
    throw new Error(
      `The space weather service answered with an error (${response.status}).`,
    )
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error("Unexpected response from the space weather service.")
  }
  return parseKp(data, Date.now())
}

function defaultStorage(): SimpleStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function isKpTable(value: unknown): value is KpTable {
  const table = value as Partial<KpTable> | null
  return (
    !!table &&
    typeof table.fetchedAt === "number" &&
    !!table.byDate &&
    typeof table.byDate === "object" &&
    Object.values(table.byDate).every((day) => !!day && typeof day === "object")
  )
}

/** The last forecast downloaded, for use when the service can't be reached. */
export function loadCachedKp(
  storage: SimpleStorage | null = defaultStorage(),
): KpTable | null {
  try {
    const value = JSON.parse(storage?.getItem(CACHE_KEY) ?? "null")
    if (isKpTable(value)) return value
  } catch {
    // Treat unreadable data as no cache.
  }
  return null
}

export function saveCachedKp(
  table: KpTable,
  storage: SimpleStorage | null = defaultStorage(),
) {
  try {
    storage?.setItem(CACHE_KEY, JSON.stringify(table))
  } catch {
    // Storage may be full or blocked; the forecast just won't be kept for offline use.
  }
}
