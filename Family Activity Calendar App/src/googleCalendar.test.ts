import assert from "node:assert/strict"
import { afterEach, test } from "node:test"
import {
  GoogleAccessError,
  fetchCalendarList,
  fetchWeek,
  loadSavedCalendar,
  parseEvents,
  saveCalendar,
} from "./googleCalendar.ts"

const DATES = [
  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
  "2026-10-08",
  "2026-10-09",
  "2026-10-10",
  "2026-10-11",
]

/** A date-time on the device's clock, as Google would send it (with a UTC offset). */
function at(day: number, hour: number, minute = 0) {
  return new Date(2026, 9, day, hour, minute).toISOString()
}

function parse(raw: Parameters<typeof parseEvents>[0]) {
  return parseEvents(raw, DATES, 7, 21, 123)
}

test("parseEvents places a timed event on its day with person, time and length", () => {
  const week = parse([
    {
      summary: "Mia: Piano",
      location: "Music school",
      start: { dateTime: at(6, 16) },
      end: { dateTime: at(6, 17, 30) },
    },
  ])
  assert.deepEqual(week.timed["2026-10-06"], [
    {
      title: "Piano",
      start: 16,
      duration: 1.5,
      person: "Mia",
      note: "Music school",
    },
  ])
  assert.equal(week.timed["2026-10-05"].length, 0)
  assert.equal(week.fetchedAt, 123)
})

test("parseEvents keeps minutes and sorts events by start", () => {
  const week = parse([
    { summary: "Late", start: { dateTime: at(7, 18, 15) }, end: { dateTime: at(7, 19) } },
    { summary: "Early", start: { dateTime: at(7, 8) }, end: { dateTime: at(7, 8, 45) } },
  ])
  assert.deepEqual(
    week.timed["2026-10-07"].map((e) => [e.title, e.start, e.duration]),
    [
      ["Early", 8, 0.75],
      ["Late", 18.25, 0.75],
    ],
  )
})

test("parseEvents shows short and zero-length events at least half an hour tall", () => {
  const week = parse([
    { summary: "Quick call", start: { dateTime: at(6, 9) }, end: { dateTime: at(6, 9, 10) } },
    { summary: "Reminder", start: { dateTime: at(6, 12) }, end: { dateTime: at(6, 12) } },
    { summary: "Last slot", start: { dateTime: at(6, 20, 50) }, end: { dateTime: at(6, 20, 55) } },
  ])
  const events = week.timed["2026-10-06"]
  assert.deepEqual(events.map((e) => e.duration), [0.5, 0.5, 0.5])
  // Nothing is drawn past the end of the day.
  assert.equal(events[2].start, 20.5)
})

test("parseEvents cuts events to the shown hours and counts the ones outside", () => {
  const week = parse([
    { summary: "Night shift", start: { dateTime: at(6, 5) }, end: { dateTime: at(6, 8) } },
    { summary: "Evening", start: { dateTime: at(6, 20) }, end: { dateTime: at(6, 23) } },
    { summary: "Breakfast", start: { dateTime: at(6, 5) }, end: { dateTime: at(6, 6) } },
    { summary: "Movie", start: { dateTime: at(6, 22) }, end: { dateTime: at(6, 23, 30) } },
  ])
  const events = week.timed["2026-10-06"]
  assert.deepEqual(
    events.map((e) => [e.title, e.start, e.duration]),
    [
      ["Night shift", 7, 1],
      ["Evening", 20, 1],
    ],
  )
  assert.equal(week.outsideHours["2026-10-06"], 2)
})

test("parseEvents splits an event that crosses midnight over both days", () => {
  const week = parse([
    { summary: "Sleepover", start: { dateTime: at(10, 19) }, end: { dateTime: at(11, 10) } },
  ])
  assert.deepEqual(
    week.timed["2026-10-10"].map((e) => [e.start, e.duration]),
    [[19, 2]],
  )
  assert.deepEqual(
    week.timed["2026-10-11"].map((e) => [e.start, e.duration]),
    [[7, 3]],
  )
})

test("parseEvents does not put an event ending at midnight on the next day", () => {
  const week = parse([
    { summary: "Film", start: { dateTime: at(6, 19) }, end: { dateTime: at(7, 0) } },
  ])
  assert.equal(week.timed["2026-10-06"].length, 1)
  assert.equal(week.timed["2026-10-07"].length, 0)
  assert.equal(week.outsideHours["2026-10-07"], undefined)
})

test("parseEvents lists all-day events on each day they cover", () => {
  const week = parse([
    // Google's end date is the day after the last day.
    { summary: "Dad: Conference", start: { date: "2026-10-07" }, end: { date: "2026-10-09" } },
    { summary: "Holiday", start: { date: "2026-10-11" }, end: { date: "2026-10-12" } },
    // Started before this week.
    { summary: "Camp", start: { date: "2026-10-02" }, end: { date: "2026-10-06" } },
  ])
  assert.deepEqual(week.allDay["2026-10-07"], [{ title: "Conference", person: "Dad" }])
  assert.deepEqual(week.allDay["2026-10-08"], [{ title: "Conference", person: "Dad" }])
  assert.equal(week.allDay["2026-10-09"].length, 0)
  assert.deepEqual(week.allDay["2026-10-11"], [{ title: "Holiday", person: "Family" }])
  assert.deepEqual(
    week.allDay["2026-10-05"].map((e) => e.title),
    ["Camp"],
  )
  assert.equal(week.allDay["2026-10-06"].length, 0)
})

test("parseEvents leaves out cancelled and declined events and names untitled ones", () => {
  const week = parse([
    { status: "cancelled", summary: "Gone", start: { dateTime: at(6, 9) }, end: { dateTime: at(6, 10) } },
    {
      summary: "Declined",
      start: { dateTime: at(6, 9) },
      end: { dateTime: at(6, 10) },
      attendees: [{ self: true, responseStatus: "declined" }],
    },
    {
      summary: "Accepted",
      start: { dateTime: at(6, 11) },
      end: { dateTime: at(6, 12) },
      attendees: [{ self: true, responseStatus: "accepted" }],
    },
    { start: { dateTime: at(6, 13) }, end: { dateTime: at(6, 14) } },
  ])
  assert.deepEqual(
    week.timed["2026-10-06"].map((e) => e.title),
    ["Accepted", "(No title)"],
  )
})

test("parseEvents turns a long description into a short plain note", () => {
  const week = parse([
    {
      summary: "Party",
      location: "Home",
      description: `<b>Bring</b> a gift ${"x".repeat(200)}`,
      start: { dateTime: at(6, 12) },
      end: { dateTime: at(6, 13) },
    },
  ])
  const note = week.timed["2026-10-06"][0].note ?? ""
  assert.ok(note.startsWith("Home · Bring a gift "))
  assert.ok(note.length <= 140)
  assert.ok(note.endsWith("…"))
})

const realFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = realFetch
})

function stubFetch(handler: (url: URL, init?: RequestInit) => Response) {
  const urls: URL[] = []
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input))
    urls.push(url)
    return handler(url, init)
  }) as typeof fetch
  return urls
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

test("fetchWeek reads every page and sends the token", async () => {
  let authorization = ""
  const urls = stubFetch((url, init) => {
    authorization = new Headers(init?.headers).get("Authorization") ?? ""
    return url.searchParams.get("pageToken")
      ? json({
          items: [{ summary: "Two", start: { dateTime: at(6, 10) }, end: { dateTime: at(6, 11) } }],
        })
      : json({
          items: [{ summary: "One", start: { dateTime: at(6, 9) }, end: { dateTime: at(6, 10) } }],
          nextPageToken: "next",
        })
  })

  const week = await fetchWeek("token-123", "family@group.calendar.google.com", DATES, 7, 21)

  assert.equal(authorization, "Bearer token-123")
  assert.equal(urls.length, 2)
  assert.ok(urls[0].pathname.includes("/calendars/family%40group.calendar.google.com/events"))
  assert.equal(urls[0].searchParams.get("singleEvents"), "true")
  assert.equal(urls[0].searchParams.get("timeMin"), new Date(2026, 9, 5).toISOString())
  assert.equal(urls[0].searchParams.get("timeMax"), new Date(2026, 9, 12).toISOString())
  assert.deepEqual(
    week.timed["2026-10-06"].map((e) => e.title),
    ["One", "Two"],
  )
})

test("fetchWeek reports an expired sign-in separately from other errors", async () => {
  stubFetch(() => json({}, 401))
  await assert.rejects(fetchWeek("old", "primary", DATES, 7, 21), GoogleAccessError)

  stubFetch(() => json({}, 500))
  await assert.rejects(
    fetchWeek("token", "primary", DATES, 7, 21),
    (error: Error) => !(error instanceof GoogleAccessError) && /500/.test(error.message),
  )
})

test("fetchCalendarList names calendars and puts the main one first", async () => {
  stubFetch(() =>
    json({
      items: [
        { id: "family", summary: "Family", summaryOverride: "Our family" },
        { id: "me@example.com", summary: "me@example.com", primary: true },
        { id: "holidays", summary: "Holidays" },
        { summary: "No id" },
      ],
    }),
  )
  assert.deepEqual(await fetchCalendarList("token"), [
    { id: "me@example.com", name: "me@example.com", primary: true },
    { id: "family", name: "Our family", primary: false },
    { id: "holidays", name: "Holidays", primary: false },
  ])
})

function memoryStorage(initial?: string) {
  let value = initial ?? null
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next
    },
    removeItem: () => {
      value = null
    },
  }
}

test("the chosen calendar is saved, loaded and forgotten", () => {
  const storage = memoryStorage()
  assert.equal(loadSavedCalendar(storage), null)

  saveCalendar({ id: "family", name: "Our family" }, storage)
  assert.deepEqual(loadSavedCalendar(storage), { id: "family", name: "Our family" })

  saveCalendar(null, storage)
  assert.equal(loadSavedCalendar(storage), null)
})

test("loadSavedCalendar ignores broken or missing storage", () => {
  assert.equal(loadSavedCalendar(memoryStorage("not json")), null)
  assert.equal(loadSavedCalendar(memoryStorage('{"id":5}')), null)
  assert.equal(loadSavedCalendar(null), null)
})
