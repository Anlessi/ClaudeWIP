// Event types and helpers shared by the sample events and the Google Calendar events.
// Plain logic with no React, so it can be tested on its own.

/** A calendar that events come from. Its name and colour are what the legend shows. */
export type CalendarSource = {
  id: string
  name: string
  /** Background colour of its events, any CSS colour. */
  color: string
  /** Text colour that is readable on `color`. */
  textColor: string
}

export type Event = {
  title: string
  /** Start time in hours, e.g. 17.5 for 17:30. */
  start: number
  /** Length in hours. */
  duration: number
  /** The `id` of the calendar the event belongs to. */
  calendarId: string
  note?: string
}

/** An event that lasts the whole day (or several days); it has no time of day. */
export type AllDayEvent = {
  title: string
  calendarId: string
}

/**
 * Events that overlap in time, shown as one card. `events` holds indexes into the list that was grouped,
 * earliest first (the longer one first when two start together); the first one is the event the card shows.
 * `start` and `end` (in hours) cover the whole group, so the card leaves no busy time looking free.
 */
export type EventGroup = { events: number[]; start: number; end: number }

/**
 * Groups events that overlap each other. A chain counts as one group: when A overlaps B and B overlaps C,
 * all three are in it, even if A and C don't overlap. Groups come in time order.
 */
export function groupOverlaps(
  events: Pick<Event, "start" | "duration">[],
): EventGroup[] {
  const order = events
    .map((_, index) => index)
    .sort(
      (a, b) =>
        events[a].start - events[b].start ||
        events[b].duration - events[a].duration,
    )

  const groups: EventGroup[] = []
  for (const index of order) {
    const { start, duration } = events[index]
    const group = groups[groups.length - 1]
    if (group && start < group.end) {
      group.events.push(index)
      group.end = Math.max(group.end, start + duration)
    } else {
      groups.push({ events: [index], start, end: start + duration })
    }
  }
  return groups
}

/** How an event card fits its text; see `cardLayout`. */
export type CardLayout = {
  /** How many rows of the title are shown. */
  titleRows: number
  /** The card is too short for the time on a row of its own, so it goes on the title's row. */
  inline: boolean
  /** There is room for the note below the time. */
  showNote: boolean
}

// Sizes from `.event-card` in index.css, in pixels (1rem = 16px): padding, title row and a row of small
// text (font size × line height, plus its top margin). The Day view has bigger padding and title text.
const CARD_SIZES = {
  week: { padding: 0.4 * 16, titleRow: 0.68 * 16 * 1.15, textRow: 0.15 * 16 + 0.58 * 16 * 1.15 },
  day: { padding: 0.55 * 16, titleRow: 0.78 * 16 * 1.15, textRow: 0.15 * 16 + 0.58 * 16 * 1.15 },
}
/** The time row with the "+1" chip (`.event-more`: font size × line height 1, plus its padding), which is taller. */
const MORE_ROW = 0.15 * 16 + 0.68 * 16 + 2 * 0.1 * 16
/** Smallest card height (`min-height` of `.event-card`). */
const CARD_MIN_HEIGHT = 2.3 * 16
const MAX_TITLE_ROWS = 4

/**
 * Works out how many whole title rows fit in a card of `height` pixels with the time below them, so a
 * title is never cut through a row or hidden behind the time. When even one row and the time don't fit,
 * the time goes on the title's row. The note only gets a row when the title can still have 2 rows.
 * `hasMore` is true when the card shows a "+1" chip next to the time.
 */
export function cardLayout(
  height: number,
  view: "week" | "day",
  { hasNote = false, hasMore = false }: { hasNote?: boolean; hasMore?: boolean } = {},
): CardLayout {
  const { padding, titleRow, textRow } = CARD_SIZES[view]
  const timeRow = hasMore ? Math.max(textRow, MORE_ROW) : textRow
  // Half a pixel of slack, so rounding in the browser doesn't cost a row.
  const space = Math.max(height, CARD_MIN_HEIGHT) - 2 * padding + 0.5
  const rowsFor = (room: number) =>
    Math.min(MAX_TITLE_ROWS, Math.floor(room / titleRow))

  const withTime = rowsFor(space - timeRow)
  if (withTime < 1) {
    return { titleRows: 1, inline: true, showNote: false }
  }
  const withNote = rowsFor(space - timeRow - textRow)
  if (hasNote && withNote >= 2) {
    return { titleRows: withNote, inline: false, showNote: true }
  }
  return { titleRows: withTime, inline: false, showNote: false }
}

/** An hour such as 17.25 as "17:15". */
export function formatTime(hour: number) {
  const totalMinutes = Math.round(hour * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}
