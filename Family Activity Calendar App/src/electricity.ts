// Finnish day-ahead electricity prices (the Nord Pool market) from https://sahkotin.fi.
// The service returns hourly prices, already averaged from Nord Pool's 15-minute prices. With `fix` the
// values are in cents per kWh, and with `vat` they include Finnish VAT. It only has prices Nord Pool has
// published: today, and tomorrow from early afternoon. Plain logic with no React, so it can be tested.

export type PriceTable = {
  /** Cents per kWh including VAT, by ISO date (in the device's time zone) and hour of the day (0-23). */
  byDate: Record<string, Record<number, number>>
  fetchedAt: number
}

type RawPrices = {
  prices?: { date?: unknown; value?: unknown }[]
}

type SimpleStorage = Pick<Storage, "getItem" | "setItem">

const PRICES_URL = "https://sahkotin.fi/prices"
const CACHE_KEY = "familyflow.prices"

/** At or below this many cents per kWh a price is marked as low, at or above HIGH_PRICE as high. */
export const LOW_PRICE = 3
export const HIGH_PRICE = 15

export type PriceLevel = "low" | "normal" | "high"

export function priceLevel(price: number): PriceLevel {
  if (price >= HIGH_PRICE) return "high"
  if (price <= LOW_PRICE) return "low"
  return "normal"
}

/** "4.3" for small prices, "12" from ten cents up: the hourly cells are narrow. */
export function formatPrice(price: number) {
  const rounded = Math.round(price * 10) / 10
  return Math.abs(rounded) >= 10 ? String(Math.round(price)) : rounded.toFixed(1)
}

/** The request range as UTC instants: local midnight of the first date up to local midnight after the last. */
export function priceRange(firstDate: string, lastDate: string) {
  const [firstYear, firstMonth, firstDay] = firstDate.split("-").map(Number)
  const [lastYear, lastMonth, lastDay] = lastDate.split("-").map(Number)
  return {
    start: new Date(firstYear, firstMonth - 1, firstDay).toISOString(),
    end: new Date(lastYear, lastMonth - 1, lastDay + 1).toISOString(),
  }
}

/**
 * Turns the service's answer into prices by local date and hour. `timeZone` defaults to the device's;
 * it is a parameter so tests do not depend on the machine they run on.
 */
export function parsePrices(
  raw: unknown,
  fetchedAt: number,
  timeZone?: string,
): PriceTable {
  const prices = (raw as RawPrices | null)?.prices
  if (!Array.isArray(prices)) {
    throw new Error("Unexpected response from the electricity price service.")
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  })

  const sums: Record<string, Record<number, { total: number; count: number }>> =
    {}
  for (const entry of prices) {
    if (typeof entry.date !== "string" || typeof entry.value !== "number") {
      continue
    }
    const time = new Date(entry.date)
    if (Number.isNaN(time.getTime()) || !Number.isFinite(entry.value)) continue

    const part = Object.fromEntries(
      formatter.formatToParts(time).map(({ type, value }) => [type, value]),
    )
    const date = `${part.year}-${part.month}-${part.day}`
    // Some browsers report midnight as "24"; the modulo makes it 0.
    const hour = Number(part.hour) % 24

    // When clocks go back, one local hour occurs twice: use the average of both.
    const day = (sums[date] ??= {})
    const slot = (day[hour] ??= { total: 0, count: 0 })
    slot.total += entry.value
    slot.count += 1
  }

  const byDate: PriceTable["byDate"] = {}
  for (const [date, hours] of Object.entries(sums)) {
    byDate[date] = Object.fromEntries(
      Object.entries(hours).map(([hour, { total, count }]) => [
        Number(hour),
        total / count,
      ]),
    )
  }
  return { byDate, fetchedAt }
}

/** Downloads the prices Nord Pool has published for the dates, from `firstDate` to `lastDate`. */
export async function fetchPrices(
  firstDate: string,
  lastDate: string,
  signal?: AbortSignal,
): Promise<PriceTable> {
  const { start, end } = priceRange(firstDate, lastDate)
  const url = `${PRICES_URL}?fix&vat&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
  // "no-cache": the service lets browsers keep an answer for an hour, which could hide tomorrow's prices.
  const response = await fetch(url, { signal, cache: "no-cache" })
  if (!response.ok) {
    throw new Error(
      `The electricity price service answered with an error (${response.status}).`,
    )
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error("Unexpected response from the electricity price service.")
  }
  return parsePrices(data, Date.now())
}

function defaultStorage(): SimpleStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function isPriceTable(value: unknown): value is PriceTable {
  const table = value as Partial<PriceTable> | null
  return (
    !!table &&
    typeof table.fetchedAt === "number" &&
    !!table.byDate &&
    typeof table.byDate === "object" &&
    Object.values(table.byDate).every(
      (day) => !!day && typeof day === "object",
    )
  )
}

/** The last prices downloaded for these dates, for use when the service can't be reached. */
export function loadCachedPrices(
  firstDate: string,
  lastDate: string,
  storage: SimpleStorage | null = defaultStorage(),
): PriceTable | null {
  try {
    const value = JSON.parse(storage?.getItem(CACHE_KEY) ?? "null")
    if (value?.key === `${firstDate}..${lastDate}` && isPriceTable(value.prices)) {
      return value.prices
    }
  } catch {
    // Treat unreadable data as no cache.
  }
  return null
}

export function saveCachedPrices(
  firstDate: string,
  lastDate: string,
  prices: PriceTable,
  storage: SimpleStorage | null = defaultStorage(),
) {
  try {
    storage?.setItem(
      CACHE_KEY,
      JSON.stringify({ key: `${firstDate}..${lastDate}`, prices }),
    )
  } catch {
    // Storage may be full or blocked; the prices just won't be kept for offline use.
  }
}
