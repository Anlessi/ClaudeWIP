// Calendar date helpers. Dates are ISO strings ("2026-10-06") in the device's local calendar, and weeks
// run Monday to Sunday. Plain logic with no React, so it can be tested on its own.

export const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const WEEKDAY_FULL_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function parts(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  return { year, month, day }
}

/** The date on the device's clock, e.g. "2026-10-06". (toISOString would give the UTC date, which can be off by a day.) */
export function localIsoDate(date: Date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Adds days to an ISO date ("2026-10-05" + 1 = "2026-10-06"). */
export function addDays(isoDate: string, days: number) {
  const { year, month, day } = parts(isoDate)
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10)
}

/** 0 for Monday up to 6 for Sunday. */
export function weekdayIndex(isoDate: string) {
  const { year, month, day } = parts(isoDate)
  const sundayFirst = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return (sundayFirst + 6) % 7
}

/** The Monday of the week containing the date. */
export function mondayOf(isoDate: string) {
  return addDays(isoDate, -weekdayIndex(isoDate))
}

/** The seven dates, Monday to Sunday, of the week containing the date. */
export function weekOf(isoDate: string) {
  const monday = mondayOf(isoDate)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

/**
 * The dates the forecast is requested for: from Monday of the current week to Sunday of the next week.
 * That is never more than 13 days ahead, inside the 15 days Open-Meteo allows.
 */
export function forecastWindow(today: string) {
  const monday = mondayOf(today)
  return Array.from({ length: 14 }, (_, index) => addDays(monday, index))
}

/**
 * "5–11 October 2026", "28 September – 4 October 2026" or "28 December 2026 – 3 January 2027".
 * `short` fits a phone on one line: a week across two months uses three-letter month names and
 * only the last year ("28 Dec – 3 Jan 2027").
 */
export function formatWeekRange(weekDates: string[], short = false) {
  const first = parts(weekDates[0])
  const last = parts(weekDates[weekDates.length - 1])
  const firstMonth = MONTH_NAMES[first.month - 1]
  const lastMonth = MONTH_NAMES[last.month - 1]

  if (short && first.month !== last.month) {
    return `${first.day} ${firstMonth.slice(0, 3)} – ${last.day} ${lastMonth.slice(0, 3)} ${last.year}`
  }
  if (first.year !== last.year) {
    return `${first.day} ${firstMonth} ${first.year} – ${last.day} ${lastMonth} ${last.year}`
  }
  if (first.month !== last.month) {
    return `${first.day} ${firstMonth} – ${last.day} ${lastMonth} ${last.year}`
  }
  return `${first.day}–${last.day} ${lastMonth} ${last.year}`
}

/** Milliseconds from `now` until the next local midnight (a second after, to be safely on the new day). */
export function msUntilNextMidnight(now: Date = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
  return next.getTime() - now.getTime()
}

export function dayNumber(isoDate: string) {
  return parts(isoDate).day
}

export function monthName(isoDate: string) {
  return MONTH_NAMES[parts(isoDate).month - 1]
}

export function yearOf(isoDate: string) {
  return parts(isoDate).year
}
