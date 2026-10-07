import assert from "node:assert/strict"
import { test } from "node:test"
import {
  classifyWeather,
  dominantKind,
  formatUtcOffset,
  loadCachedForecast,
  loadSavedLocation,
  parseForecast,
  saveCachedForecast,
  saveLocation,
  summarizeDay,
  type WeatherKind,
} from "./weather.ts"

function hoursOf(kindAt: (hour: number) => WeatherKind) {
  return Array.from({ length: 14 }, (_, index) => {
    const hour = 7 + index
    return { hour, kind: kindAt(hour) }
  })
}

function fakeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}

test("classifyWeather maps weather codes to calendar categories", () => {
  assert.equal(classifyWeather(0, 0), "sunny")
  assert.equal(classifyWeather(1, 20), "sunny")
  assert.equal(classifyWeather(2, 30), "sunny")
  assert.equal(classifyWeather(2, 80), "cloudy")
  assert.equal(classifyWeather(3, 100), "cloudy")
  assert.equal(classifyWeather(45, 100), "cloudy")
  assert.equal(classifyWeather(53, 100), "rain")
  assert.equal(classifyWeather(65, 100), "rain")
  assert.equal(classifyWeather(81, 100), "rain")
  assert.equal(classifyWeather(95, 100), "rain")
  assert.equal(classifyWeather(73, 100), "snow")
  assert.equal(classifyWeather(86, 100), "snow")
})

test("summarizeDay describes when it rains", () => {
  assert.equal(summarizeDay([]), "")
  assert.equal(
    summarizeDay(hoursOf((hour) => (hour >= 17 ? "rain" : "cloudy"))),
    "Rain from 17:00",
  )
  assert.equal(
    summarizeDay(hoursOf((hour) => (hour <= 10 ? "rain" : "sunny"))),
    "Rain until 11:00",
  )
  assert.equal(
    summarizeDay(
      hoursOf((hour) => (hour >= 11 && hour <= 13 ? "rain" : "cloudy")),
    ),
    "Rain 11:00–14:00",
  )
  assert.equal(
    summarizeDay(hoursOf((hour) => (hour % 3 === 0 ? "rain" : "cloudy"))),
    "Rain at times",
  )
  assert.equal(summarizeDay(hoursOf(() => "rain")), "Rain all day")
  assert.equal(summarizeDay(hoursOf(() => "snow")), "Snow all day")
})

test("summarizeDay describes dry days by how sunny they are", () => {
  assert.equal(summarizeDay(hoursOf(() => "sunny")), "Sunny")
  assert.equal(
    summarizeDay(hoursOf((hour) => (hour < 16 ? "sunny" : "cloudy"))),
    "Mostly sunny",
  )
  assert.equal(
    summarizeDay(hoursOf((hour) => (hour < 11 ? "sunny" : "cloudy"))),
    "Sunny spells",
  )
  assert.equal(summarizeDay(hoursOf(() => "cloudy")), "Cloudy")
})

test("dominantKind picks one category for the day", () => {
  assert.equal(dominantKind(["rain", "rain", "rain", "sunny"]), "rain")
  assert.equal(dominantKind(["snow", "snow", "snow", "rain"]), "snow")
  assert.equal(dominantKind(["rain", "rain", "sunny", "sunny"]), "sunny")
  assert.equal(dominantKind(["cloudy", "cloudy", "sunny"]), "cloudy")
})

test("formatUtcOffset", () => {
  assert.equal(formatUtcOffset(10800), "GMT+3")
  assert.equal(formatUtcOffset(-12600), "GMT-3:30")
  assert.equal(formatUtcOffset(0), "GMT+0")
})

function rawForecast() {
  const time: string[] = []
  const temperature_2m: (number | null)[] = []
  const weather_code: (number | null)[] = []
  const cloud_cover: (number | null)[] = []
  const is_day: (number | null)[] = []
  for (const date of ["2026-10-05", "2026-10-06"]) {
    for (let hour = 0; hour < 24; hour++) {
      time.push(`${date}T${String(hour).padStart(2, "0")}:00`)
      temperature_2m.push(date === "2026-10-05" ? 10.4 : -0.4)
      weather_code.push(date === "2026-10-05" ? (hour >= 17 ? 61 : 3) : 0)
      cloud_cover.push(100)
      is_day.push(hour >= 8 && hour < 18 ? 1 : 0)
    }
  }
  return {
    utc_offset_seconds: 10800,
    hourly: { time, temperature_2m, weather_code, cloud_cover, is_day },
    daily: {
      time: ["2026-10-05", "2026-10-06"],
      temperature_2m_max: [12.6, 1.2],
      temperature_2m_min: [6.1, -3.7],
    },
  }
}

const week = ["2026-10-05", "2026-10-06", "2026-10-07"]

test("parseForecast keeps the visible hours and converts the values", () => {
  const forecast = parseForecast(rawForecast(), week, 7, 21, 1000)

  assert.equal(forecast.utcOffsetSeconds, 10800)
  assert.equal(forecast.fetchedAt, 1000)
  assert.deepEqual(forecast.dates, week)
  assert.equal(forecast.days.length, 3)

  const monday = forecast.days[0]!
  assert.deepEqual(Object.keys(monday.hours).map(Number), [
    7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  ])
  assert.deepEqual(monday.hours[7], {
    kind: "cloudy",
    temp: 10,
    night: true,
    cloud: 100,
  })
  assert.deepEqual(monday.hours[12], {
    kind: "cloudy",
    temp: 10,
    night: false,
    cloud: 100,
  })
  assert.equal(monday.hours[17].kind, "rain")
  assert.equal(monday.high, 13)
  assert.equal(monday.low, 6)
  assert.equal(monday.kind, "rain")
  assert.equal(monday.summary, "Rain from 17:00")

  const tuesday = forecast.days[1]!
  assert.equal(tuesday.hours[9].temp, 0)
  assert.equal(Object.is(tuesday.hours[9].temp, -0), false)
  assert.equal(tuesday.high, 1)
  assert.equal(tuesday.low, -4)
  assert.equal(tuesday.summary, "Sunny")

  assert.equal(forecast.days[2], null)
})

test("parseForecast skips hours with missing values", () => {
  const raw = rawForecast()
  raw.hourly.temperature_2m[9] = null
  const forecast = parseForecast(raw, week, 7, 21, 0)
  assert.equal(forecast.days[0]!.hours[9], undefined)
  assert.ok(forecast.days[0]!.hours[10])
})

test("parseForecast rejects responses it cannot understand", () => {
  assert.throws(() => parseForecast({}, week, 7, 21, 0), /Unexpected response/)
  assert.throws(() => parseForecast(null, week, 7, 21, 0), /Unexpected response/)
  assert.throws(
    () => parseForecast({ hourly: { time: [] } }, week, 7, 21, 0),
    /Unexpected response/,
  )
})

test("the saved location is stored and validated", () => {
  const storage = fakeStorage()
  assert.equal(loadSavedLocation(storage), null)

  const helsinki = { name: "Helsinki", latitude: 60.17, longitude: 24.94 }
  saveLocation(helsinki, storage)
  assert.deepEqual(loadSavedLocation(storage), helsinki)

  storage.setItem("familyflow.location", "not json")
  assert.equal(loadSavedLocation(storage), null)
  storage.setItem(
    "familyflow.location",
    JSON.stringify({ name: "Nowhere", latitude: 999, longitude: 0 }),
  )
  assert.equal(loadSavedLocation(storage), null)
  assert.equal(loadSavedLocation(null), null)
})

test("a saved forecast in an unexpected shape is ignored", () => {
  const storage = fakeStorage()
  const helsinki = { name: "Helsinki", latitude: 60.17, longitude: 24.94 }
  const forecast = parseForecast(rawForecast(), week, 7, 21, 5)
  const key = `${helsinki.latitude},${helsinki.longitude},${week[0]}..${week[2]}`
  const save = (value: unknown) =>
    storage.setItem(
      "familyflow.forecast",
      JSON.stringify({ key, forecast: value }),
    )

  save(forecast)
  assert.deepEqual(loadCachedForecast(helsinki, week, storage), forecast)

  const { dates: _dates, ...withoutDates } = forecast
  save(withoutDates)
  assert.equal(loadCachedForecast(helsinki, week, storage), null)
  save({ ...forecast, dates: ["2026-10-05", "2026-10-06", "2026-10-08"] })
  assert.equal(loadCachedForecast(helsinki, week, storage), null)
  save({ ...forecast, days: [null] })
  assert.equal(loadCachedForecast(helsinki, week, storage), null)
  save({ ...forecast, days: [1, 2, 3] })
  assert.equal(loadCachedForecast(helsinki, week, storage), null)
  save({ ...forecast, fetchedAt: "yesterday" })
  assert.equal(loadCachedForecast(helsinki, week, storage), null)
  save("nonsense")
  assert.equal(loadCachedForecast(helsinki, week, storage), null)
})

test("the cached forecast is only used for the same place and week", () => {
  const storage = fakeStorage()
  const helsinki = { name: "Helsinki", latitude: 60.17, longitude: 24.94 }
  const other = { name: "Oulu", latitude: 65.01, longitude: 25.47 }
  const forecast = parseForecast(rawForecast(), week, 7, 21, 5)

  assert.equal(loadCachedForecast(helsinki, week, storage), null)
  saveCachedForecast(helsinki, week, forecast, storage)
  assert.deepEqual(loadCachedForecast(helsinki, week, storage), forecast)
  assert.equal(loadCachedForecast(other, week, storage), null)
  assert.equal(
    loadCachedForecast(helsinki, ["2026-10-12", ...week.slice(1)], storage),
    null,
  )
})
