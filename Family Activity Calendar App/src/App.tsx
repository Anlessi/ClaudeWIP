import { useMemo, useState, type ReactNode } from "react"
import Icon from "./Icon"
import logo from "./assets/logo.png"
import LocationDialog from "./LocationDialog"
import {
  WEEKDAY_NAMES,
  addDays,
  dayNumber,
  forecastWindow,
  formatWeekRange,
  mondayOf,
  monthName,
  weekOf,
  weekdayIndex,
  yearOf,
} from "./dates"
import { HIGH_PRICE, LOW_PRICE, formatPrice, priceLevel } from "./electricity"
import CalendarDialog from "./CalendarDialog"
import {
  layoutLanes,
  type AllDayEvent,
  type CalendarSource,
  type Event,
  type Lane,
} from "./events"
import useForecast from "./useForecast"
import useGoogleCalendar from "./useGoogleCalendar"
import usePrices from "./usePrices"
import useToday from "./useToday"
import {
  formatUtcOffset,
  loadSavedLocation,
  saveLocation,
  type DayWeather,
  type SavedLocation,
  type WeatherKind,
} from "./weather"

type ViewMode = "day" | "week"

type EventDraft = Event & {
  date: string
}

type CalendarDay = {
  /** ISO date, e.g. "2026-10-06". */
  iso: string
  short: string
  date: number
  month: string
  /** 0 for Monday up to 6 for Sunday. */
  index: number
}

/** Events by ISO date. */
type EventsByDate = Record<string, Event[]>

function calendarDay(iso: string): CalendarDay {
  const index = weekdayIndex(iso)
  return {
    iso,
    short: WEEKDAY_NAMES[index],
    date: dayNumber(iso),
    month: monthName(iso),
    index,
  }
}

/** Puts the sample events into the week that contains `today`. */
function sampleEvents(today: string): EventsByDate {
  const monday = mondayOf(today)
  return Object.fromEntries(
    SAMPLE_WEEK_EVENTS.map((events, index) => [
      addDays(monday, index),
      events.map((event) => ({ ...event })),
    ]),
  )
}

const START_HOUR = 7
const END_HOUR = 24
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, index) => START_HOUR + index,
)

// The sample events all belong to one made-up calendar.
const SAMPLE_CALENDAR: CalendarSource = {
  id: "sample",
  name: "Sample events",
  color: "var(--family)",
  textColor: "white",
}

// Sample events for each weekday (Monday first). They are placed in the current week when the app opens.
const SAMPLE_WEEK_EVENTS: Event[][] = [
  [
    { title: "Dentist", start: 8, duration: 1, calendarId: SAMPLE_CALENDAR.id },
    { title: "Team meeting", start: 9, duration: 1, calendarId: SAMPLE_CALENDAR.id },
    { title: "Piano", start: 16, duration: 1, calendarId: SAMPLE_CALENDAR.id },
    {
      title: "Football",
      start: 17,
      duration: 1.5,
      calendarId: SAMPLE_CALENDAR.id,
      note: "Bring raincoat",
    },
  ],
  [
    { title: "Pick up Leo", start: 15, duration: 1, calendarId: SAMPLE_CALENDAR.id },
    { title: "Late shift", start: 17, duration: 3, calendarId: SAMPLE_CALENDAR.id },
  ],
  [
    { title: "Dentist", start: 9, duration: 1, calendarId: SAMPLE_CALENDAR.id },
    { title: "Swim", start: 17, duration: 1, calendarId: SAMPLE_CALENDAR.id },
    { title: "Yoga", start: 18, duration: 1, calendarId: SAMPLE_CALENDAR.id },
  ],
  [
    {
      title: "Choir",
      start: 16,
      duration: 1,
      calendarId: SAMPLE_CALENDAR.id,
      note: "Heavy rain",
    },
    { title: "Football", start: 17, duration: 1.5, calendarId: SAMPLE_CALENDAR.id },
    { title: "Parent meeting", start: 18.5, duration: 1.5, calendarId: SAMPLE_CALENDAR.id },
  ],
  [
    { title: "Gym", start: 7, duration: 1, calendarId: SAMPLE_CALENDAR.id },
    { title: "Sleepover", start: 17, duration: 2, calendarId: SAMPLE_CALENDAR.id },
    { title: "Book club", start: 19, duration: 2, calendarId: SAMPLE_CALENDAR.id },
  ],
  [
    { title: "Market", start: 8, duration: 1.5, calendarId: SAMPLE_CALENDAR.id },
    { title: "Match", start: 10, duration: 2, calendarId: SAMPLE_CALENDAR.id },
    { title: "Party", start: 11, duration: 2, calendarId: SAMPLE_CALENDAR.id },
  ],
  [
    { title: "Run", start: 9, duration: 1, calendarId: SAMPLE_CALENDAR.id },
    { title: "Family lunch", start: 13, duration: 2, calendarId: SAMPLE_CALENDAR.id },
    { title: "Meal prep", start: 17, duration: 1, calendarId: SAMPLE_CALENDAR.id },
  ],
]

// Shown in the time column until a forecast tells us the time zone of the chosen location.
const DEFAULT_TIME_ZONE_LABEL = "GMT+2"

function Button({
  children,
  className = "",
  label,
  onClick,
  style,
}: {
  children: ReactNode
  className?: string
  label?: string
  onClick?: () => void
  style?: React.CSSProperties
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  )
}

function Toggle({
  checked,
  children,
  onChange,
}: {
  checked: boolean
  children: ReactNode
  onChange: () => void
}) {
  return (
    <Button
      className={`filter-toggle ${checked ? "filter-toggle--active" : ""}`}
      onClick={onChange}
    >
      <span className="filter-check">
        {checked && <Icon name="check" size={13} />}
      </span>
      {children}
    </Button>
  )
}

function WeatherIcon({
  kind,
  size = 18,
  night = false,
}: {
  kind: WeatherKind
  size?: number
  night?: boolean
}) {
  const iconName =
    kind === "sunny"
      ? night
        ? "moon"
        : "sun"
      : kind === "cloudy"
        ? "cloud"
        : kind === "snow"
          ? "snow"
          : "rain"
  return <Icon name={iconName} size={size} />
}

function clockTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function WeatherStatus({
  hasLocation,
  noForecastInView,
  loading,
  error,
  saved,
  fetchedAt,
  onSetLocation,
  onRetry,
}: {
  hasLocation: boolean
  /** A forecast is loaded, but none of the days on screen are covered by it. */
  noForecastInView: boolean
  loading: boolean
  error: string
  saved: boolean
  fetchedAt: number | null
  onSetLocation: () => void
  onRetry: () => void
}) {
  const time = fetchedAt ? clockTime(fetchedAt) : ""

  return (
    <p className="data-status" role="status">
      {!hasLocation && (
        <>
          Set your location to see the hourly weather.
          <button type="button" className="weather-link" onClick={onSetLocation}>
            Set location
          </button>
        </>
      )}
      {hasLocation && loading && fetchedAt === null && "Loading weather…"}
      {hasLocation && noForecastInView && (
        <span>
          No forecast for these dates. Weather is shown for this week and next
          week.
        </span>
      )}
      {hasLocation && error && (
        <>
          <span className="data-status__error">
            {error}
            {saved && ` Showing the forecast saved at ${time}.`}
          </span>
          <button type="button" className="weather-link" onClick={onRetry}>
            Try again
          </button>
        </>
      )}
      {fetchedAt !== null && (
        <span>
          {!error && `Updated ${time} · `}Weather data by{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo.com
          </a>
        </span>
      )}
    </p>
  )
}

function PriceStatus({
  loading,
  noPricesInView,
  error,
  saved,
  fetchedAt,
  onRetry,
}: {
  loading: boolean
  /** Prices are loaded, but none of the days on screen have any. */
  noPricesInView: boolean
  error: string
  saved: boolean
  fetchedAt: number | null
  onRetry: () => void
}) {
  const time = fetchedAt ? clockTime(fetchedAt) : ""

  return (
    <p className="data-status" role="status">
      {loading && fetchedAt === null && "Loading electricity prices…"}
      {noPricesInView && (
        <span>
          No electricity prices for these dates. They are shown for this week,
          up to the latest day Nord Pool has published (tomorrow, from early
          afternoon).
        </span>
      )}
      {error && (
        <>
          <span className="data-status__error">
            {error}
            {saved && ` Showing the prices saved at ${time}.`}
          </span>
          <button type="button" className="weather-link" onClick={onRetry}>
            Try again
          </button>
        </>
      )}
      {fetchedAt !== null && (
        <span>
          {!error && `Updated ${time} · `}Electricity prices for Finland incl.
          VAT: Nord Pool day-ahead via{" "}
          <a href="https://sahkotin.fi/" target="_blank" rel="noreferrer">
            sahkotin.fi
          </a>
        </span>
      )}
    </p>
  )
}

function GoogleStatus({
  configured,
  calendarNames,
  loading,
  hasEvents,
  error,
  needsSignIn,
  fetchedAt,
  outsideHours,
  onOpenSettings,
  onReconnect,
  onRetry,
}: {
  configured: boolean
  /** Empty when Google Calendar isn't connected. */
  calendarNames: string[]
  loading: boolean
  /** Events for the week on screen have been loaded. */
  hasEvents: boolean
  error: string
  needsSignIn: boolean
  fetchedAt: number | null
  /** Events on screen that fall outside the hours the calendar shows. */
  outsideHours: number
  onOpenSettings: () => void
  onReconnect: () => Promise<void>
  onRetry: () => void
}) {
  const [signInMessage, setSignInMessage] = useState("")
  const time = fetchedAt ? clockTime(fetchedAt) : ""

  if (calendarNames.length === 0) {
    return (
      <p className="data-status" role="status">
        These are sample events.
        {configured && (
          <button type="button" className="weather-link" onClick={onOpenSettings}>
            Connect Google Calendar
          </button>
        )}
      </p>
    )
  }

  return (
    <p className="data-status" role="status">
      {loading && !hasEvents && "Loading Google Calendar…"}
      {needsSignIn && (
        <>
          <span className="data-status__error">
            {signInMessage || "Sign in to Google again to load your events."}
          </span>
          <button
            type="button"
            className="weather-link"
            onClick={() => {
              setSignInMessage("")
              onReconnect().catch(() =>
                setSignInMessage("Couldn't sign in to Google. Try again."),
              )
            }}
          >
            Sign in
          </button>
        </>
      )}
      {error && (
        <>
          <span className="data-status__error">{error}</span>
          <button type="button" className="weather-link" onClick={onRetry}>
            Try again
          </button>
        </>
      )}
      {outsideHours > 0 && (
        <span>
          {outsideHours} {outsideHours === 1 ? "event is" : "events are"}{" "}
          outside {formatTime(START_HOUR)}–{formatTime(END_HOUR)} and not
          shown.
        </span>
      )}
      <span>
        {fetchedAt !== null && !error && `Updated ${time} · `}Events from
        Google Calendar{" "}
        {calendarNames.map((name) => `"${name}"`).join(", ")} (read-only:
        change them in Google Calendar)
      </span>
    </p>
  )
}

/** An hour such as 17.25 as "17:15". */
function formatTime(hour: number) {
  const totalMinutes = Math.round(hour * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

/** `onClick` is missing for events that can't be edited here (the ones from Google Calendar). */
function EventCard({
  event,
  calendar,
  lane,
  onClick,
}: {
  event: Event
  calendar: CalendarSource
  lane: Lane
  onClick?: () => void
}) {
  const style = {
    "--event-top": `${(event.start - START_HOUR) * 64 + 4}px`,
    "--event-height": `${event.duration * 64 - 8}px`,
    "--event-color": calendar.color,
    "--event-text": calendar.textColor,
    "--event-lane": lane.lane,
    "--event-lanes": lane.lanes,
    // Events that share the width take more of the column (over the weather and price readings),
    // otherwise each one is too narrow to read.
    ...(lane.lanes > 1 && { "--lane-left": lane.lanes === 2 ? "30%" : "10%" }),
  } as React.CSSProperties

  const content = (
    <>
      <strong>{event.title}</strong>
      <span>{formatTime(event.start)}</span>
      {event.note && <small>{event.note}</small>}
    </>
  )

  if (!onClick) {
    return (
      <div
        className="event-card event-card--readonly"
        style={style}
        title={[
          `${event.title} (${calendar.name})`,
          `${formatTime(event.start)}–${formatTime(event.start + event.duration)}`,
          event.note,
        ]
          .filter(Boolean)
          .join("\n")}
      >
        {content}
      </div>
    )
  }

  return (
    <Button
      className="event-card"
      style={style}
      label={`Edit ${event.title} at ${formatTime(event.start)}`}
      onClick={onClick}
    >
      {content}
    </Button>
  )
}

function AllDayRow({
  events,
  rows,
  calendars,
}: {
  events: AllDayEvent[]
  rows: number
  calendars: Map<string, CalendarSource>
}) {
  // When there are more than fit, the last row says how many more there are.
  const hidden = events.length > rows ? events.length - rows + 1 : 0
  const shown = hidden ? events.slice(0, rows - 1) : events
  return (
    <div className="allday-row">
      {shown.map((event, index) => {
        const calendar = calendars.get(event.calendarId) ?? SAMPLE_CALENDAR
        return (
          <span
            className="allday-chip"
            key={`${event.title}-${index}`}
            style={{ background: calendar.color, color: calendar.textColor }}
            title={`${event.title} (${calendar.name}, all day)`}
          >
            {event.title}
          </span>
        )
      })}
      {hidden > 0 && (
        <span
          className="allday-chip allday-chip--more"
          title={events
            .slice(rows - 1)
            .map((event) => event.title)
            .join("\n")}
        >
          +{hidden} more
        </span>
      )}
    </div>
  )
}

function DayColumn({
  day,
  events,
  allDay,
  allDayRows,
  calendars,
  weather,
  prices,
  showWeather,
  showPrices,
  isToday,
  selected,
  onEditEvent,
  onSelect,
}: {
  day: CalendarDay
  events: Event[]
  /** All-day events of this day; only shown when `allDayRows` is above zero. */
  allDay: AllDayEvent[]
  /** How many rows the all-day area has, the same for every day on screen so the hours line up. */
  allDayRows: number
  /** The calendars events can belong to, by id. */
  calendars: Map<string, CalendarSource>
  weather: DayWeather | null
  /** Cents per kWh by hour, or undefined when there are no prices for this day. */
  prices: Record<number, number> | undefined
  showWeather: boolean
  showPrices: boolean
  isToday: boolean
  selected: boolean
  /** Missing when the events can't be edited here. */
  onEditEvent?: (eventIndex: number) => void
  onSelect: () => void
}) {
  const lanes = layoutLanes(events)

  return (
    <section
      className={`day-column ${isToday ? "day-column--today" : ""} ${
        selected ? "day-column--selected" : ""
      }`}
    >
      <Button
        className="day-heading"
        onClick={onSelect}
        label={`Show ${day.short} ${day.date}${isToday ? " (today)" : ""}`}
      >
        <span className="day-name">{day.short}</span>
        <span className="day-date">{day.date}</span>
        {isToday && <span className="today-label">Today</span>}
        <span className="day-summary">
          {weather && (
            <>
              {showWeather && <WeatherIcon kind={weather.kind} size={15} />}
              {weather.high}° / {weather.low}° · {weather.summary}
            </>
          )}
        </span>
      </Button>

      {allDayRows > 0 && <AllDayRow events={allDay} rows={allDayRows} calendars={calendars} />}

      <div className="day-body">
        {HOURS.map((hour) => {
          const hourWeather = weather?.hours[hour]
          const price = prices?.[hour]
          const level = price === undefined ? "normal" : priceLevel(price)
          return (
            <div
              className={`hour-cell ${
                showWeather && hourWeather ? `weather-${hourWeather.kind}` : ""
              }`}
              key={hour}
            >
              <span className="cell-data">
                {showWeather && hourWeather && (
                  <span className="weather-reading">
                    <WeatherIcon
                      kind={hourWeather.kind}
                      night={hourWeather.night}
                      size={15}
                    />
                    {hourWeather.temp}°
                  </span>
                )}
                {showPrices && price !== undefined && (
                  <span
                    className={`price-reading ${
                      level === "high"
                        ? "price-reading--high"
                        : level === "low"
                          ? "price-reading--low"
                          : ""
                    }`}
                    aria-label={`${formatPrice(price)} cents per kilowatt hour${
                      level === "high"
                        ? ", high price"
                        : level === "low"
                          ? ", low price"
                          : ""
                    }`}
                  >
                    <Icon name="bolt" size={11} />
                    {formatPrice(price)}
                    {level === "high" && (
                      <span className="price-trend price-trend--high">
                        <Icon name="arrow-up" size={10} />
                      </span>
                    )}
                    {level === "low" && (
                      <span className="price-trend price-trend--low">
                        <Icon name="arrow-down" size={10} />
                      </span>
                    )}
                  </span>
                )}
              </span>
            </div>
          )
        })}
        <div className="events-layer">
          {events.map((event, eventIndex) => (
            <EventCard
              event={event}
              calendar={calendars.get(event.calendarId) ?? SAMPLE_CALENDAR}
              lane={lanes[eventIndex]}
              key={`${event.title}-${event.start}-${eventIndex}`}
              onClick={onEditEvent && (() => onEditEvent(eventIndex))}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [view, setView] = useState<ViewMode>("week")
  const [showWeather, setShowWeather] = useState(true)
  const [showPrices, setShowPrices] = useState(true)
  const today = useToday()
  // null means "follow today", so the calendar moves on by itself when the date changes.
  const [pickedDate, setPickedDate] = useState<string | null>(null)
  const selectedDate = pickedDate ?? today
  const [calendarEvents, setCalendarEvents] = useState<EventsByDate>(() =>
    sampleEvents(today),
  )
  const [editingEvent, setEditingEvent] = useState<{
    date: string
    eventIndex: number
  } | null>(null)
  const [draft, setDraft] = useState<EventDraft | null>(null)
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false)
  const [location, setLocation] = useState<SavedLocation | null>(
    loadSavedLocation,
  )
  // First visit: ask for a location straight away, since the weather depends on it.
  const [locationDialogOpen, setLocationDialogOpen] = useState(
    location === null,
  )

  // The forecast covers the current week and the next one, counted from today.
  const windowStart = mondayOf(today)
  const forecastDates = useMemo(() => forecastWindow(windowStart), [windowStart])
  const weather = useForecast(location, forecastDates, START_HOUR, END_HOUR)
  // Prices only exist for days Nord Pool has published: past days, today and, from early afternoon, tomorrow.
  const electricity = usePrices(
    forecastDates[0],
    forecastDates[forecastDates.length - 1],
  )

  const chooseLocation = (next: SavedLocation) => {
    saveLocation(next)
    setLocation(next)
    setLocationDialogOpen(false)
  }

  const timeZoneLabel = weather.forecast
    ? formatUtcOffset(weather.forecast.utcOffsetSeconds)
    : DEFAULT_TIME_ZONE_LABEL
  const hasSnow = !!weather.forecast?.days.some(
    (day) =>
      day && Object.values(day.hours).some((hour) => hour.kind === "snow"),
  )

  const weekDates = useMemo(() => weekOf(selectedDate), [selectedDate])
  const weekDays = useMemo(() => weekDates.map(calendarDay), [weekDates])
  const selectedDay = calendarDay(selectedDate)
  const visibleDays = useMemo(
    () => (view === "day" ? [calendarDay(selectedDate)] : weekDays),
    [view, selectedDate, weekDays],
  )

  const weatherByDate = useMemo(() => {
    const byDate = new Map<string, DayWeather>()
    weather.forecast?.days.forEach((day, index) => {
      if (day) byDate.set(weather.forecast!.dates[index], day)
    })
    return byDate
  }, [weather.forecast])
  // Once Google Calendar is connected its events replace the sample events, and they can't be edited here.
  const google = useGoogleCalendar(weekDates, START_HOUR, END_HOUR)
  const googleConnected = google.calendars.length > 0
  // The legend lists the calendars the events come from.
  const calendarSummary =
    google.calendars.length === 1
      ? google.calendars[0].name
      : `${google.calendars.length} calendars`
  const legendCalendars = googleConnected ? google.calendars : [SAMPLE_CALENDAR]
  const calendarsById = useMemo(
    () => new Map(legendCalendars.map((calendar) => [calendar.id, calendar])),
    [googleConnected, google.calendars],
  )
  const eventsOn = (iso: string): Event[] =>
    googleConnected
      ? (google.week?.timed[iso] ?? [])
      : (calendarEvents[iso] ?? [])
  const allDayOn = (iso: string): AllDayEvent[] =>
    googleConnected ? (google.week?.allDay[iso] ?? []) : []
  const allDayRows = Math.min(
    3,
    Math.max(0, ...visibleDays.map((day) => allDayOn(day.iso).length)),
  )
  const outsideHours = googleConnected
    ? visibleDays.reduce(
        (sum, day) => sum + (google.week?.outsideHours[day.iso] ?? 0),
        0,
      )
    : 0

  const noForecastInView =
    weather.forecast !== null &&
    visibleDays.every((day) => !weatherByDate.has(day.iso))

  const noPricesInView =
    electricity.prices !== null &&
    visibleDays.every((day) => !electricity.prices?.byDate[day.iso])

  // Arrows move by a week in the week view and by a day in the day view.
  const step = view === "week" ? 7 : 1
  const moveDate = (direction: number) =>
    setPickedDate(addDays(selectedDate, direction * step))

  const openNewEvent = () => {
    setEditingEvent(null)
    setDraft({
      title: "",
      date: selectedDate,
      start: 9,
      duration: 1,
      calendarId: SAMPLE_CALENDAR.id,
      note: "",
    })
  }

  const openExistingEvent = (date: string, eventIndex: number) => {
    const event = calendarEvents[date]?.[eventIndex]
    if (!event) return
    setEditingEvent({ date, eventIndex })
    setDraft({ ...event, date })
  }

  const closeEditor = () => {
    setDraft(null)
    setEditingEvent(null)
  }

  const saveEvent = () => {
    if (!draft || !draft.title.trim()) return

    const start = Math.min(Math.max(draft.start, START_HOUR), END_HOUR - 0.5)
    const nextEvent: Event = {
      title: draft.title.trim(),
      start,
      duration: Math.min(Math.max(draft.duration, 0.5), 4, END_HOUR - start),
      calendarId: SAMPLE_CALENDAR.id,
      note: draft.note?.trim(),
    }

    setCalendarEvents((current) => {
      const next: EventsByDate = { ...current }
      if (editingEvent) {
        next[editingEvent.date] = (next[editingEvent.date] ?? []).filter(
          (_, index) => index !== editingEvent.eventIndex,
        )
      }
      next[draft.date] = [...(next[draft.date] ?? []), nextEvent].sort(
        (a, b) => a.start - b.start,
      )
      return next
    })
    setPickedDate(draft.date)
    closeEditor()
  }

  const deleteEvent = () => {
    if (!editingEvent) return
    setCalendarEvents((current) => ({
      ...current,
      [editingEvent.date]: (current[editingEvent.date] ?? []).filter(
        (_, index) => index !== editingEvent.eventIndex,
      ),
    }))
    closeEditor()
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src={logo} alt="" />
          <span>Week at a Glance</span>
        </div>
        <nav className="view-switcher" aria-label="Calendar view">
          <Button
            className={
              view === "day" ? "view-option view-option--active" : "view-option"
            }
            onClick={() => setView("day")}
          >
            Day
          </Button>
          <Button
            className={
              view === "week"
                ? "view-option view-option--active"
                : "view-option"
            }
            onClick={() => setView("week")}
          >
            Week
          </Button>
        </nav>
      </header>

      <section className="calendar-header">
        <div className="date-block">
          <div className="title-row">
            <h1>
              {view === "week"
                ? formatWeekRange(weekDates)
                : `${selectedDay.short}, ${selectedDay.month} ${selectedDay.date}`}
            </h1>
            {view === "day" && (
              <span className="date-range">{yearOf(selectedDate)}</span>
            )}
          </div>
        </div>

        <div className="header-actions">
          <div className="date-nav">
            <Button
              className="icon-button"
              label={view === "week" ? "Previous week" : "Previous day"}
              onClick={() => moveDate(-1)}
            >
              <Icon name="chevron-left" />
            </Button>
            <Button className="today-button" onClick={() => setPickedDate(null)}>
              Today
            </Button>
            <Button
              className="icon-button"
              label={view === "week" ? "Next week" : "Next day"}
              onClick={() => moveDate(1)}
            >
              <Icon name="chevron-right" />
            </Button>
          </div>
          <div className="filters" aria-label="Calendar layers">
            <Button
              className="filter-toggle location-button"
              label={
                location
                  ? `Change location, currently ${location.name}`
                  : "Set location"
              }
              onClick={() => setLocationDialogOpen(true)}
            >
              <Icon name="pin" size={16} />
              <span>{location ? location.name : "Set location"}</span>
            </Button>
            <Toggle
              checked={showWeather}
              onChange={() => setShowWeather((value) => !value)}
            >
              <Icon name="sun" size={16} /> Weather
            </Toggle>
            <Toggle
              checked={showPrices}
              onChange={() => setShowPrices((value) => !value)}
            >
              <Icon name="bolt" size={16} /> Electricity
            </Toggle>
            <Button
              className="filter-toggle location-button"
              label={
                googleConnected
                  ? `Google Calendar settings, showing ${calendarSummary}`
                  : "Connect Google Calendar"
              }
              onClick={() => setCalendarDialogOpen(true)}
            >
              <Icon name="calendar" size={16} />
              <span>
                {googleConnected ? calendarSummary : "Connect calendar"}
              </span>
            </Button>
            {!googleConnected && (
              <Button className="add-event-button" onClick={openNewEvent}>
                <Icon name="plus" size={16} /> Add event
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="legend-bar">
        <div className="calendar-legend">
          {legendCalendars.map((calendar) => (
            <span className="legend-item" key={calendar.id}>
              <i style={{ background: calendar.color }} />
              {calendar.name}
            </span>
          ))}
        </div>
        <div className="data-legend">
          {showWeather && (
            <span className="weather-legend">
              <span className="weather-key weather-key--sunny">
                <WeatherIcon kind="sunny" size={14} />
                Sunny
              </span>
              <span className="weather-key weather-key--cloudy">
                <WeatherIcon kind="cloudy" size={14} />
                Cloudy
              </span>
              <span className="weather-key weather-key--rain">
                <WeatherIcon kind="rain" size={14} />
                Rain
              </span>
              {hasSnow && (
                <span className="weather-key weather-key--snow">
                  <WeatherIcon kind="snow" size={14} />
                  Snow
                </span>
              )}
            </span>
          )}
          {showPrices && (
            <>
              <span className="price-legend-label">
                <Icon name="bolt" size={12} />
                Price c/kWh incl. VAT
              </span>
              <b className="price-low">
                {LOW_PRICE} or below
                <span className="price-trend price-trend--low">
                  <Icon name="arrow-down" size={10} />
                </span>
              </b>
              <b className="price-high">
                {HIGH_PRICE}+
                <span className="price-trend price-trend--high">
                  <Icon name="arrow-up" size={10} />
                </span>
              </b>
            </>
          )}
        </div>
      </section>

      <section
        className="schedule-frame"
        style={{ "--allday-rows": allDayRows } as React.CSSProperties}
      >
        <div className="time-column">
          <div className="time-heading">{timeZoneLabel}</div>
          {allDayRows > 0 && (
            <div className="time-allday">
              <span>All day</span>
            </div>
          )}
          {HOURS.map((hour) => (
            <div className="time-label" key={hour}>
              {formatTime(hour)}
            </div>
          ))}
        </div>
        <div className={`days-grid days-grid--${view}`} key={view}>
          {visibleDays.map((day) => (
            <DayColumn
              day={day}
              events={eventsOn(day.iso)}
              allDay={allDayOn(day.iso)}
              allDayRows={allDayRows}
              calendars={calendarsById}
              weather={weatherByDate.get(day.iso) ?? null}
              prices={electricity.prices?.byDate[day.iso]}
              key={day.iso}
              onEditEvent={
                googleConnected
                  ? undefined
                  : (eventIndex) => openExistingEvent(day.iso, eventIndex)
              }
              onSelect={() => {
                setPickedDate(day.iso)
                if (window.innerWidth < 700) setView("day")
              }}
              isToday={day.iso === today}
              selected={view === "week" && day.iso === selectedDate}
              showPrices={showPrices}
              showWeather={showWeather}
            />
          ))}
        </div>
      </section>

      <WeatherStatus
        hasLocation={location !== null}
        noForecastInView={noForecastInView}
        loading={weather.status === "loading"}
        error={weather.error}
        saved={weather.saved}
        fetchedAt={weather.forecast?.fetchedAt ?? null}
        onSetLocation={() => setLocationDialogOpen(true)}
        onRetry={weather.reload}
      />

      <GoogleStatus
        configured={google.configured}
        calendarNames={google.calendars.map((calendar) => calendar.name)}
        loading={google.loading}
        hasEvents={google.week !== null}
        error={google.error}
        needsSignIn={google.needsSignIn}
        fetchedAt={google.week?.fetchedAt ?? null}
        outsideHours={outsideHours}
        onOpenSettings={() => setCalendarDialogOpen(true)}
        onReconnect={google.reconnect}
        onRetry={google.reload}
      />

      {showPrices && (
        <PriceStatus
          loading={electricity.status === "loading"}
          noPricesInView={noPricesInView}
          error={electricity.error}
          saved={electricity.saved}
          fetchedAt={electricity.prices?.fetchedAt ?? null}
          onRetry={electricity.reload}
        />
      )}

      {locationDialogOpen && (
        <LocationDialog
          current={location}
          onSelect={chooseLocation}
          onClose={() => setLocationDialogOpen(false)}
        />
      )}

      {calendarDialogOpen && (
        <CalendarDialog
          configured={google.configured}
          current={google.calendars}
          ensureToken={google.ensureToken}
          onSelect={google.selectCalendars}
          onDisconnect={google.disconnect}
          onClose={() => setCalendarDialogOpen(false)}
        />
      )}

      {draft && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor()
          }}
        >
          <section
            className="event-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-editor-title"
          >
            <div className="editor-heading">
              <div>
                <p className="eyebrow">
                  {editingEvent ? "Update schedule" : "Plan something"}
                </p>
                <h2 id="event-editor-title">
                  {editingEvent ? "Edit event" : "Add new event"}
                </h2>
              </div>
              <Button
                className="editor-close"
                label="Close event editor"
                onClick={closeEditor}
              >
                <Icon name="x" size={19} />
              </Button>
            </div>

            <div className="editor-form">
              <label className="field field--full">
                <span>Event name</span>
                <input
                  autoFocus
                  value={draft.title}
                  placeholder="e.g. Football practice"
                  onChange={(event) =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveEvent()
                  }}
                />
              </label>

              <label className="field">
                <span>Day</span>
                <select
                  value={draft.date}
                  onChange={(event) =>
                    setDraft({ ...draft, date: event.target.value })
                  }
                >
                  {weekDays.map((day) => (
                    <option value={day.iso} key={day.iso}>
                      {day.short}, {day.month} {day.date}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Starts at</span>
                <input
                  type="time"
                  min="07:00"
                  max="23:30"
                  step="1800"
                  value={formatTime(draft.start)}
                  onChange={(event) => {
                    if (!event.target.value) return
                    const [hours, minutes] = event.target.value
                      .split(":")
                      .map(Number)
                    setDraft({
                      ...draft,
                      start: hours + Math.round(minutes / 30) / 2,
                    })
                  }}
                />
              </label>

              <label className="field">
                <span>Duration</span>
                <select
                  value={draft.duration}
                  onChange={(event) =>
                    setDraft({ ...draft, duration: Number(event.target.value) })
                  }
                >
                  {[0.5, 1, 1.5, 2, 2.5, 3, 4].map((duration) => (
                    <option value={duration} key={duration}>
                      {duration < 1
                        ? "30 minutes"
                        : `${duration} ${duration === 1 ? "hour" : "hours"}`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field field--full">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={draft.note ?? ""}
                  placeholder="Optional details"
                  onChange={(event) =>
                    setDraft({ ...draft, note: event.target.value })
                  }
                />
              </label>
            </div>

            <div className="editor-actions">
              {editingEvent ? (
                <Button className="delete-event-button" onClick={deleteEvent}>
                  <Icon name="trash" size={16} /> Delete
                </Button>
              ) : (
                <span />
              )}
              <div>
                <Button className="cancel-button" onClick={closeEditor}>
                  Cancel
                </Button>
                <Button className="save-event-button" onClick={saveEvent}>
                  {editingEvent ? "Save changes" : "Add to calendar"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
