// Event types and helpers shared by the sample events and the Google Calendar events.
// Plain logic with no React, so it can be tested on its own.

export type Person = "Mum" | "Dad" | "Mia" | "Leo" | "Family"

export const PEOPLE: Person[] = ["Mum", "Dad", "Mia", "Leo", "Family"]

export type Event = {
  title: string
  /** Start time in hours, e.g. 17.5 for 17:30. */
  start: number
  /** Length in hours. */
  duration: number
  person: Person
  note?: string
}

/** An event that lasts the whole day (or several days); it has no time of day. */
export type AllDayEvent = {
  title: string
  person: Person
}

// What people call each family member in an event title. "Mom" is accepted as well as "Mum".
const NAME_PATTERN = /\b(mum|mom|dad|mia|leo)\b/gi

const NAME_TO_PERSON: Record<string, Person> = {
  mum: "Mum",
  mom: "Mum",
  dad: "Dad",
  mia: "Mia",
  leo: "Leo",
}

/**
 * Works out who an event is for from its title. The first family member named wins ("Mia: Piano",
 * "Piano for Mia & Leo" is Mia's); an event that names nobody is a Family event. A leading
 * "Name:" or "Name -" is dropped from the title, because the colour already says who it is.
 */
export function personFromTitle(rawTitle: string): {
  person: Person
  title: string
} {
  const title = rawTitle.trim()
  NAME_PATTERN.lastIndex = 0
  const match = NAME_PATTERN.exec(title)
  if (!match) return { person: "Family", title }

  const person = NAME_TO_PERSON[match[1].toLowerCase()]
  const prefix = /^(mum|mom|dad|mia|leo)\s*[:\-–]\s*(.+)$/i.exec(title)
  return { person, title: prefix ? prefix[2].trim() : title }
}

/** Where an event sits when overlapping events share the width of a day: lane 0 of 2, lane 1 of 2, … */
export type Lane = { lane: number; lanes: number }

/**
 * Lays out events that overlap in time side by side. Events are grouped into clusters of events that
 * overlap each other, and every event in a cluster gets the same number of lanes so the cards line up.
 * Returns one entry for each event, in the same order as `events`.
 */
export function layoutLanes(
  events: Pick<Event, "start" | "duration">[],
): Lane[] {
  const order = events
    .map((_, index) => index)
    .sort(
      (a, b) =>
        events[a].start - events[b].start ||
        events[b].duration - events[a].duration,
    )

  const result: Lane[] = events.map(() => ({ lane: 0, lanes: 1 }))
  let cluster: number[] = []
  let clusterEnd = -Infinity
  let laneEnds: number[] = []

  const closeCluster = () => {
    for (const index of cluster) result[index].lanes = laneEnds.length
    cluster = []
    laneEnds = []
  }

  for (const index of order) {
    const { start, duration } = events[index]
    if (cluster.length > 0 && start >= clusterEnd) closeCluster()

    let lane = laneEnds.findIndex((end) => end <= start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(0)
    }
    laneEnds[lane] = start + duration
    result[index].lane = lane
    cluster.push(index)
    clusterEnd = Math.max(clusterEnd, start + duration)
  }
  closeCluster()

  return result
}
