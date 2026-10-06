// Weather data for the calendar, from Open-Meteo (https://open-meteo.com, no API key needed).
// Everything here is plain logic with no React, so it can be tested on its own.

export type WeatherKind = "sunny" | "cloudy" | "rain" | "snow"

export type HourWeather = {
  kind: WeatherKind
  temp: number
  night: boolean
}

export type DayWeather = {
  high: number
  low: number
  kind: WeatherKind
  summary: string
  hours: Record<number, HourWeather>
}

export type Forecast = {
  /** The ISO dates the forecast was requested for; `days` has one entry for each. */
  dates: string[]
  /** Null when the service returned nothing for that day. */
  days: (DayWeather | null)[]
  utcOffsetSeconds: number
  fetchedAt: number
}

export type SavedLocation = {
  name: string
  latitude: number
  longitude: number
}

export type Place = SavedLocation & {
  /** Region and country, e.g. "Uusimaa, Finland". */
  detail: string
}

type Nullable<T> = T | null

type RawForecast = {
  utc_offset_seconds?: number
  hourly?: {
    time?: string[]
    temperature_2m?: Nullable<number>[]
    weather_code?: Nullable<number>[]
    cloud_cover?: Nullable<number>[]
    is_day?: Nullable<number>[]
  }
  daily?: {
    time?: string[]
    temperature_2m_max?: Nullable<number>[]
    temperature_2m_min?: Nullable<number>[]
  }
}

type RawGeocoding = {
  results?: {
    name?: string
    latitude?: number
    longitude?: number
    admin1?: string
    country?: string
  }[]
}

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

const LOCATION_KEY = "familyflow.location"
const FORECAST_CACHE_KEY = "familyflow.forecast"

/** Turns a WMO weather code (plus cloud cover for "partly cloudy") into one of the calendar's categories. */
export function classifyWeather(code: number, cloudCover: number): WeatherKind {
  if (code === 0 || code === 1) return "sunny"
  if (code === 2) return cloudCover <= 50 ? "sunny" : "cloudy"
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow"
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
    return "rain"
  }
  return "cloudy"
}

function pad(hour: number) {
  return String(hour).padStart(2, "0")
}

function isWet(kind: WeatherKind) {
  return kind === "rain" || kind === "snow"
}

/** A short description of a day, e.g. "Rain from 17:00", from its hours in the visible range. */
export function summarizeDay(
  hours: { hour: number; kind: WeatherKind }[],
): string {
  if (hours.length === 0) return ""

  const wet = hours.filter((entry) => isWet(entry.kind))
  if (wet.length > 0) {
    const snowHours = wet.filter((entry) => entry.kind === "snow").length
    const noun = snowHours * 2 > wet.length ? "Snow" : "Rain"
    const first = wet[0].hour
    const last = wet[wet.length - 1].hour
    const dayStart = hours[0].hour
    const dayEnd = hours[hours.length - 1].hour

    if (wet.length >= hours.length * 0.85) return `${noun} all day`
    if (last - first + 1 !== wet.length) return `${noun} at times`
    if (first <= dayStart + 1) return `${noun} until ${pad(last + 1)}:00`
    if (last >= dayEnd - 1) return `${noun} from ${pad(first)}:00`
    return `${noun} ${pad(first)}:00–${pad(last + 1)}:00`
  }

  const sunnyShare =
    hours.filter((entry) => entry.kind === "sunny").length / hours.length
  if (sunnyShare >= 0.75) return "Sunny"
  if (sunnyShare >= 0.5) return "Mostly sunny"
  if (sunnyShare >= 0.25) return "Sunny spells"
  return "Cloudy"
}

/** The one category that best represents a day, used for the icon in the day heading. */
export function dominantKind(kinds: WeatherKind[]): WeatherKind {
  const wet = kinds.filter(isWet)
  if (wet.length >= 3) {
    return wet.filter((kind) => kind === "snow").length * 2 > wet.length
      ? "snow"
      : "rain"
  }
  const sunny = kinds.filter((kind) => kind === "sunny").length
  return sunny * 2 >= kinds.length ? "sunny" : "cloudy"
}

/** "GMT+3", "GMT-3:30" from an offset in seconds. */
export function formatUtcOffset(seconds: number) {
  const sign = seconds < 0 ? "-" : "+"
  const total = Math.abs(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  return `GMT${sign}${hours}${minutes ? `:${pad(minutes)}` : ""}`
}


function roundTemp(value: number) {
  return Math.round(value) || 0
}

function isNumberArray(value: unknown): value is Nullable<number>[] {
  return Array.isArray(value)
}

/**
 * Converts an Open-Meteo response into the calendar's shape. `weekDates` are the ISO dates of the
 * calendar days; only hours from `firstHour` up to (not including) `endHour` are kept.
 */
export function parseForecast(
  raw: unknown,
  weekDates: string[],
  firstHour: number,
  endHour: number,
  fetchedAt: number,
): Forecast {
  const data = raw as RawForecast | null
  const hourly = data?.hourly
  const times = hourly?.time
  const temps = hourly?.temperature_2m
  const codes = hourly?.weather_code
  const clouds = hourly?.cloud_cover
  const isDay = hourly?.is_day
  if (
    !Array.isArray(times) ||
    !isNumberArray(temps) ||
    !isNumberArray(codes) ||
    !isNumberArray(clouds) ||
    !isNumberArray(isDay)
  ) {
    throw new Error("Unexpected response from the weather service.")
  }

  const byDate = new Map<string, Record<number, HourWeather>>()
  times.forEach((time, index) => {
    const temp = temps[index]
    const code = codes[index]
    const cloud = clouds[index]
    const day = isDay[index]
    if (temp == null || code == null || cloud == null || day == null) return

    const hour = Number(time.slice(11, 13))
    if (hour < firstHour || hour >= endHour) return

    const date = time.slice(0, 10)
    const hours = byDate.get(date) ?? {}
    hours[hour] = {
      kind: classifyWeather(code, cloud),
      temp: roundTemp(temp),
      night: day === 0,
    }
    byDate.set(date, hours)
  })

  const dailyDates = data?.daily?.time
  const dailyMax = data?.daily?.temperature_2m_max
  const dailyMin = data?.daily?.temperature_2m_min

  const days = weekDates.map((date): DayWeather | null => {
    const hours = byDate.get(date)
    if (!hours) return null

    const entries = Object.entries(hours)
      .map(([hour, value]) => ({ hour: Number(hour), ...value }))
      .sort((a, b) => a.hour - b.hour)
    const temperatures = entries.map((entry) => entry.temp)

    const dailyIndex = Array.isArray(dailyDates) ? dailyDates.indexOf(date) : -1
    const max = dailyIndex >= 0 ? dailyMax?.[dailyIndex] : null
    const min = dailyIndex >= 0 ? dailyMin?.[dailyIndex] : null

    return {
      high: max == null ? Math.max(...temperatures) : roundTemp(max),
      low: min == null ? Math.min(...temperatures) : roundTemp(min),
      kind: dominantKind(entries.map((entry) => entry.kind)),
      summary: summarizeDay(entries),
      hours,
    }
  })

  return {
    dates: [...weekDates],
    days,
    utcOffsetSeconds:
      typeof data?.utc_offset_seconds === "number" ? data.utc_offset_seconds : 0,
    fetchedAt,
  }
}

/** Downloads the hourly forecast for the calendar's dates at a location. */
export async function fetchForecast(
  location: SavedLocation,
  weekDates: string[],
  firstHour: number,
  endHour: number,
  signal?: AbortSignal,
): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    hourly: "temperature_2m,weather_code,cloud_cover,is_day",
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    start_date: weekDates[0],
    end_date: weekDates[weekDates.length - 1],
  })
  const response = await fetch(`${FORECAST_URL}?${params}`, { signal })
  if (!response.ok) {
    throw new Error(`The weather service answered with an error (${response.status}).`)
  }
  let data: unknown
  try {
    data = await response.json()
  } catch {
    // For example a sign-in page from public Wi-Fi instead of weather data.
    throw new Error("Unexpected response from the weather service.")
  }
  return parseForecast(data, weekDates, firstHour, endHour, Date.now())
}

/** Looks up places by name, e.g. "Helsinki". */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<Place[]> {
  const params = new URLSearchParams({
    name: query,
    count: "6",
    language: "en",
    format: "json",
  })
  const response = await fetch(`${GEOCODING_URL}?${params}`, { signal })
  if (!response.ok) {
    throw new Error(`The place search answered with an error (${response.status}).`)
  }
  const data = (await response.json()) as RawGeocoding
  const results = Array.isArray(data.results) ? data.results : []

  return results.flatMap((result): Place[] => {
    if (
      typeof result.name !== "string" ||
      typeof result.latitude !== "number" ||
      typeof result.longitude !== "number"
    ) {
      return []
    }
    return [
      {
        name: result.name,
        latitude: roundCoordinate(result.latitude),
        longitude: roundCoordinate(result.longitude),
        detail: [result.admin1, result.country].filter(Boolean).join(", "),
      },
    ]
  })
}

/** About 1 km precision: plenty for weather, and no more exact than needed. */
function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100
}

type SimpleStorage = Pick<Storage, "getItem" | "setItem">

function defaultStorage(): SimpleStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function loadSavedLocation(
  storage: SimpleStorage | null = defaultStorage(),
): SavedLocation | null {
  try {
    const value = JSON.parse(storage?.getItem(LOCATION_KEY) ?? "null")
    if (
      value &&
      typeof value.name === "string" &&
      Number.isFinite(value.latitude) &&
      Number.isFinite(value.longitude) &&
      Math.abs(value.latitude) <= 90 &&
      Math.abs(value.longitude) <= 180
    ) {
      return {
        name: value.name,
        latitude: value.latitude,
        longitude: value.longitude,
      }
    }
  } catch {
    // Unreadable or blocked storage: behave as if no location was saved.
  }
  return null
}

export function saveLocation(
  location: SavedLocation,
  storage: SimpleStorage | null = defaultStorage(),
) {
  try {
    storage?.setItem(LOCATION_KEY, JSON.stringify(location))
  } catch {
    // Storage may be full or blocked; the location just won't be remembered.
  }
}

function forecastKey(location: SavedLocation, weekDates: string[]) {
  return `${location.latitude},${location.longitude},${weekDates[0]}..${weekDates[weekDates.length - 1]}`
}

/** The last forecast downloaded for this location and week, for use when the service can't be reached. */
export function loadCachedForecast(
  location: SavedLocation,
  weekDates: string[],
  storage: SimpleStorage | null = defaultStorage(),
): Forecast | null {
  try {
    const value = JSON.parse(storage?.getItem(FORECAST_CACHE_KEY) ?? "null")
    if (
      value?.key === forecastKey(location, weekDates) &&
      isForecastFor(value.forecast, weekDates)
    ) {
      return value.forecast
    }
  } catch {
    // Treat unreadable data as no cache.
  }
  return null
}

/** Guards against saved data from an older version or damaged data, which would otherwise break the calendar. */
function isForecastFor(value: unknown, weekDates: string[]): value is Forecast {
  const forecast = value as Partial<Forecast> | null
  return (
    !!forecast &&
    Array.isArray(forecast.dates) &&
    forecast.dates.length === weekDates.length &&
    forecast.dates.every((date, index) => date === weekDates[index]) &&
    Array.isArray(forecast.days) &&
    forecast.days.length === weekDates.length &&
    forecast.days.every(
      (day) => day === null || (typeof day === "object" && !!day.hours),
    ) &&
    typeof forecast.fetchedAt === "number" &&
    typeof forecast.utcOffsetSeconds === "number"
  )
}

export function saveCachedForecast(
  location: SavedLocation,
  weekDates: string[],
  forecast: Forecast,
  storage: SimpleStorage | null = defaultStorage(),
) {
  try {
    storage?.setItem(
      FORECAST_CACHE_KEY,
      JSON.stringify({ key: forecastKey(location, weekDates), forecast }),
    )
  } catch {
    // Storage may be full or blocked; the forecast just won't be kept for offline use.
  }
}
