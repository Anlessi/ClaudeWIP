// Reads events from Google Calendar (read-only) and turns them into the calendar's events.
// Plain logic with no React, so it can be tested on its own. Signing in is in googleAuth.ts.

import { addDays } from "./dates.ts"
import { personFromTitle, type AllDayEvent, type Event } from "./events.ts"

export type GoogleCalendarInfo = {
  id: string
  name: string
  primary: boolean
}

/** The chosen calendar, remembered in this browser. */
export type SavedCalendar = {
  id: string
  name: string
}

/** One week of events from Google, by ISO date. */
export type GoogleWeek = {
  timed: Record<string, Event[]>
  allDay: Record<string, AllDayEvent[]>
  /** Timed events that fall wholly before or after the hours the calendar shows, by date. */
  outsideHours: Record<string, number>
  fetchedAt: number
}

type RawEvent = {
  status?: string
  summary?: string
  description?: string
  location?: string
  start?: { date?: string; dateTime?: string }
  end?: { date?: string; dateTime?: string }
  attendees?: { self?: boolean; responseStatus?: string }[]
}

type RawEventList = {
  items?: RawEvent[]
  nextPageToken?: string
}

type RawCalendarList = {
  items?: {
    id?: string
    summary?: string
    summaryOverride?: string
    primary?: boolean
  }[]
}

const API_URL = "https://www.googleapis.com/calendar/v3"
const CALENDAR_KEY = "familyflow.googleCalendar"

/** Thrown when Google says the sign-in has expired or doesn't allow this request. */
export class GoogleAccessError extends Error {}

const MAX_NOTE_LENGTH = 140
/** The shortest an event is drawn, in hours. */
const MIN_SHOWN = 0.5

function hoursOfDay(date: Date) {
  return date.getHours() + date.getMinutes() / 60
}

/** A short single-line note from an event's location and description. */
function noteFor(event: RawEvent) {
  const text = [event.location, event.description]
    .filter((part): part is string => !!part?.trim())
    .map((part) => part.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" · ")
  if (!text) return undefined
  return text.length > MAX_NOTE_LENGTH
    ? `${text.slice(0, MAX_NOTE_LENGTH - 1)}…`
    : text
}

/**
 * Turns the raw events Google sent into events by day for the calendar. Times are shown on the device's
 * clock. An event that crosses midnight is split into one piece for each day, and each piece is cut to
 * the hours the calendar shows (`firstHour` to `endHour`). Events outside those hours are counted, not
 * drawn. Events you have declined or that were cancelled are left out.
 */
export function parseEvents(
  raw: RawEvent[],
  dates: string[],
  firstHour: number,
  endHour: number,
  fetchedAt: number,
): GoogleWeek {
  const week: GoogleWeek = {
    timed: Object.fromEntries(dates.map((date) => [date, []])),
    allDay: Object.fromEntries(dates.map((date) => [date, []])),
    outsideHours: {},
    fetchedAt,
  }

  for (const event of raw) {
    if (event.status === "cancelled") continue
    if (event.attendees?.some((a) => a.self && a.responseStatus === "declined")) {
      continue
    }

    const { person, title } = personFromTitle(event.summary ?? "")
    const shownTitle = title || "(No title)"

    if (event.start?.date) {
      // All-day events: `end.date` is the day after the last day.
      const last = event.end?.date ? addDays(event.end.date, -1) : event.start.date
      for (const date of dates) {
        if (date >= event.start.date && date <= last) {
          week.allDay[date].push({ title: shownTitle, person })
        }
      }
      continue
    }

    if (!event.start?.dateTime) continue
    const start = new Date(event.start.dateTime)
    const end = new Date(event.end?.dateTime ?? event.start.dateTime)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue

    const note = noteFor(event)
    for (const date of dates) {
      const [year, month, day] = date.split("-").map(Number)
      const dayStart = new Date(year, month - 1, day)
      const dayEnd = new Date(year, month - 1, day + 1)
      // An event with no length still shows on the day it happens.
      const isMoment = end.getTime() === start.getTime()
      if (start >= dayEnd || !(end > dayStart || (isMoment && start >= dayStart))) {
        continue
      }

      const from = start > dayStart ? hoursOfDay(start) : 0
      const to = end < dayEnd ? hoursOfDay(end) : 24
      if (to <= firstHour || from >= endHour) {
        week.outsideHours[date] = (week.outsideHours[date] ?? 0) + 1
        continue
      }

      // Cards are at least half an hour tall so that short events can still be read and tapped.
      const shownStart = Math.min(Math.max(from, firstHour), endHour - MIN_SHOWN)
      const shownEnd = Math.min(Math.max(to, shownStart + MIN_SHOWN), endHour)
      week.timed[date].push({
        title: shownTitle,
        start: shownStart,
        duration: shownEnd - shownStart,
        person,
        note,
      })
    }
  }

  for (const date of dates) {
    week.timed[date].sort((a, b) => a.start - b.start)
  }
  return week
}

async function googleGet<T>(
  path: string,
  params: Record<string, string>,
  accessToken: string,
  signal?: AbortSignal,
): Promise<T> {
  const url = `${API_URL}${path}?${new URLSearchParams(params)}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  })
  if (response.status === 401 || response.status === 403) {
    throw new GoogleAccessError("Google Calendar access has expired.")
  }
  if (!response.ok) {
    throw new Error(`Google Calendar answered with an error (${response.status}).`)
  }
  return (await response.json()) as T
}

/** The calendars the signed-in account can read, the main one first. */
export async function fetchCalendarList(
  accessToken: string,
  signal?: AbortSignal,
): Promise<GoogleCalendarInfo[]> {
  const data = await googleGet<RawCalendarList>(
    "/users/me/calendarList",
    {
      minAccessRole: "reader",
      fields: "items(id,summary,summaryOverride,primary)",
    },
    accessToken,
    signal,
  )
  return (data.items ?? [])
    .filter((item): item is { id: string } & typeof item => !!item.id)
    .map((item) => ({
      id: item.id,
      name: item.summaryOverride || item.summary || item.id,
      primary: !!item.primary,
    }))
    .sort((a, b) => Number(b.primary) - Number(a.primary))
}

/** Loads one calendar's events for the given consecutive dates and turns them into calendar events. */
export async function fetchWeek(
  accessToken: string,
  calendarId: string,
  dates: string[],
  firstHour: number,
  endHour: number,
  signal?: AbortSignal,
): Promise<GoogleWeek> {
  const first = dates[0]
  const last = dates[dates.length - 1]
  const [fy, fm, fd] = first.split("-").map(Number)
  const [ly, lm, ld] = last.split("-").map(Number)
  const timeMin = new Date(fy, fm - 1, fd).toISOString()
  const timeMax = new Date(ly, lm - 1, ld + 1).toISOString()

  const raw: RawEvent[] = []
  let pageToken = ""
  do {
    const params: Record<string, string> = {
      singleEvents: "true",
      orderBy: "startTime",
      timeMin,
      timeMax,
      maxResults: "250",
      fields:
        "nextPageToken,items(status,summary,description,location,start,end,attendees(self,responseStatus))",
    }
    if (pageToken) params.pageToken = pageToken
    const page = await googleGet<RawEventList>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      params,
      accessToken,
      signal,
    )
    raw.push(...(page.items ?? []))
    pageToken = page.nextPageToken ?? ""
  } while (pageToken)

  return parseEvents(raw, dates, firstHour, endHour, Date.now())
}

type SimpleStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">

function defaultStorage(): SimpleStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/** The calendar chosen on an earlier visit, or null if Google Calendar was never connected. */
export function loadSavedCalendar(
  storage: SimpleStorage | null = defaultStorage(),
): SavedCalendar | null {
  try {
    const value = JSON.parse(storage?.getItem(CALENDAR_KEY) ?? "null")
    if (value && typeof value.id === "string" && typeof value.name === "string") {
      return { id: value.id, name: value.name }
    }
  } catch {
    // Unreadable or blocked storage: behave as if nothing was saved.
  }
  return null
}

export function saveCalendar(
  calendar: SavedCalendar | null,
  storage: SimpleStorage | null = defaultStorage(),
) {
  try {
    if (calendar) storage?.setItem(CALENDAR_KEY, JSON.stringify(calendar))
    else storage?.removeItem(CALENDAR_KEY)
  } catch {
    // Storage full or blocked: the choice just isn't remembered.
  }
}
