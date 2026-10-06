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
