import { useEffect, useMemo, useState, type ReactNode } from "react"
import Icon from "./Icon"
import logo from "./assets/logo-transparent.png"
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
import {
  AURORA_LEVEL_NAMES,
  auroraHours,
  auroraLevel,
  formatKp,
  kpNeeded,
  type AuroraLevel,
} from "./aurora"
import { HIGH_PRICE, LOW_PRICE, formatPrice, priceLevel } from "./electricity"
import CalendarDialog from "./CalendarDialog"
import EventDialog from "./EventDialog"
import {
  cardLayout,
  formatTime,
  groupOverlaps,
  type AllDayEvent,
  type CalendarSource,
  type Event,
} from "./events"
import useAurora from "./useAurora"
import useForecast from "./useForecast"
import useGoogleCalendar from "./useGoogleCalendar"
import usePrices from "./usePrices"
import useToday from "./useToday"
import {
  applyTheme,
  saveTheme,
  savedTheme,
  systemTheme,
  type Theme,
} from "./theme"
import {
  formatUtcOffset,
  loadSavedLocation,
  saveLocation,
  type DayWeather,
  type SavedLocation,
  type WeatherKind,
} from "./weather"

type ViewMode = "day" | "week"

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
    {
      title: "Team meeting about the spring trip",
      start: 9,
      duration: 1,
      calendarId: SAMPLE_CALENDAR.id,
    },
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
    { title: "Pick up Leo", start: 15, duration: 0.5, calendarId: SAMPLE_CALENDAR.id },
    { title: "Late shift", start: 17, duration: 3, calendarId: SAMPLE_CALENDAR.id },
  ],
  [
    { title: "Dentist", start: 9, duration: 1, calendarId: SAMPLE_CALENDAR.id },
    { title: "Swim", start: 17, duration: 1, calendarId: SAMPLE_CALENDAR.id },
    { title: "Call grandma", start: 17.5, duration: 0.5, calendarId: SAMPLE_CALENDAR.id },
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

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => savedTheme() ?? systemTheme())

  useEffect(() => applyTheme(theme), [theme])

  // Until the user picks a theme, follow the device setting as it changes.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)")
    const follow = () => {
      if (!savedTheme()) setTheme(systemTheme())
    }
    query.addEventListener("change", follow)
    return () => query.removeEventListener("change", follow)
  }, [])

  const next: Theme = theme === "dark" ? "light" : "dark"
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      onClick={() => {
        saveTheme(next)
        setTheme(next)
      }}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
    </button>
  )
}

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

function AuroraStatus({
  hasLocation,
  neededKp,
  tooFarSouth,
  loading,
  error,
  saved,
  fetchedAt,
  onRetry,
}: {
  hasLocation: boolean
  /** The Kp needed to see the lights at the chosen place. */
  neededKp: number | null
  /** The lights are almost never seen at the chosen place. */
  tooFarSouth: boolean
  loading: boolean
  error: string
  saved: boolean
  fetchedAt: number | null
  onRetry: () => void
}) {
  const time = fetchedAt ? clockTime(fetchedAt) : ""

  return (
    <p className="data-status" role="status">
      {!hasLocation && "Set your location to see the northern lights forecast."}
      {tooFarSouth && "Northern lights are almost never seen this far south."}
      {loading && fetchedAt === null && "Loading the northern lights forecast…"}
      {error && (
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
          {!error && `Updated ${time} · `}Northern lights for the next 3 days,
          in dark hours with clear enough skies until{" "}
          {formatTime(END_HOUR)}
          {neededKp !== null && `, when activity reaches Kp ${neededKp} or more here`}
          . Aurora level: Kp 0–2 low, 3–4 mid, 5–9 high. Kp forecast by{" "}
          <a href="https://www.swpc.noaa.gov/" target="_blank" rel="noreferrer">
            NOAA SWPC
          </a>
        </span>
      )}
    </p>
  )
}

/** At the top of the page when the northern lights may be seen this evening. */
function AuroraNotice({ from, kp }: { from: number; kp: number }) {
  return (
    <p className="sample-notice aurora-notice" role="status">
      <Icon name="aurora" size={16} />
      <span>
        Northern lights possible tonight from {formatTime(from)} (
        {AURORA_LEVEL_NAMES[auroraLevel(kp)].toLowerCase()} aurora level, clear
        enough skies).
      </span>
    </p>
  )
}

/** At the top of the page when calendars are chosen but Google needs a new sign-in (it is not kept after a reload). */
function SignInNotice({ onReconnect }: { onReconnect: () => Promise<void> }) {
  const [message, setMessage] = useState("")
  return (
    <p className="sample-notice" role="status">
      {message || "Sign in to Google to see your calendar events."}
      <button
        type="button"
        className="weather-link"
        onClick={() => {
          setMessage("")
          onReconnect().catch(() =>
            setMessage("Couldn't sign in to Google. Try again."),
          )
        }}
      >
        Sign in
      </button>
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

  // Before connecting, the notice is at the top of the page (SampleNotice).
  if (calendarNames.length === 0) return null

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

/** Tells that the events on screen are samples, at the top of the page where it is easy to find. */
function SampleNotice({
  configured,
  onOpenSettings,
}: {
  configured: boolean
  onOpenSettings: () => void
}) {
  return (
    <p className="sample-notice" role="status">
      These are sample events.
      {configured && (
        <button type="button" className="weather-link" onClick={onOpenSettings}>
          Connect Google Calendar
        </button>
      )}
    </p>
  )
}

/** "17:00–18:30" */
function timeRange(event: Event) {
  return `${formatTime(event.start)}–${formatTime(event.start + event.duration)}`
}

/**
 * One card for a group of overlapping events: it shows the earliest one, says how many more there are
 * ("+1") and covers the time of the whole group. Clicking it opens the details of every event in it.
 */
function EventCard({
  events,
  start,
  end,
  view,
  calendarOf,
  onOpen,
}: {
  /** Earliest first; the first one is shown. */
  events: Event[]
  /** Start and end of the whole group, in hours. */
  start: number
  end: number
  view: ViewMode
  calendarOf: (event: Event) => CalendarSource
  onOpen: () => void
}) {
  const [event, ...others] = events
  const calendar = calendarOf(event)
  const height = (end - start) * 64 - 8
  const layout = cardLayout(height, view, {
    hasNote: !!event.note,
    hasMore: others.length > 0,
  })
  const style = {
    "--event-top": `${(start - START_HOUR) * 64 + 4}px`,
    "--event-height": `${height}px`,
    "--event-color": calendar.color,
    "--event-text": calendar.textColor,
    "--title-lines": layout.titleRows,
  } as React.CSSProperties
  const more = others.length > 0 && (
    <span className="event-more">+{others.length}</span>
  )

  return (
    <button
      type="button"
      className={`event-card ${layout.inline ? "event-card--inline" : ""}`}
      style={style}
      onClick={onOpen}
      aria-label={`${event.title}, ${timeRange(event)}${
        others.length > 0
          ? `, and ${others.length} more ${others.length === 1 ? "event" : "events"}`
          : ""
      }. Show details`}
      title={events
        .map((item) =>
          [`${item.title} (${calendarOf(item).name})`, timeRange(item), item.note]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n")}
    >
      <strong>{event.title}</strong>
      <span className="event-time">
        {formatTime(event.start)}
        {more}
      </span>
      {layout.showNote && <small>{event.note}</small>}
    </button>
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
  aurora,
  showWeather,
  showPrices,
  isToday,
  selected,
  onSelect,
  view,
  onOpenEvents,
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
  /** Forecast Kp by hour, for the hours the northern lights may be seen; empty when hidden. */
  aurora: Map<number, number>
  showWeather: boolean
  showPrices: boolean
  isToday: boolean
  selected: boolean
  onSelect: () => void
  view: ViewMode
  /** Opens the details of a card's events. */
  onOpenEvents: (events: Event[]) => void
}) {
  const groups = groupOverlaps(events)
  const calendarOf = (event: Event) =>
    calendars.get(event.calendarId) ?? SAMPLE_CALENDAR

  return (
    <section
      className={`day-column ${isToday ? "day-column--today" : ""} ${
        selected ? "day-column--selected" : ""
      }`}
    >
      <Button
        className="day-heading"
        onClick={onSelect}
        label={`Show ${day.short} ${day.date}${isToday ? " (today)" : ""}${
          aurora.size > 0 ? ", northern lights possible" : ""
        }`}
      >
        <span className="day-name">{day.short}</span>
        <span className="day-date">{day.date}</span>
        {isToday && <span className="today-label">Today</span>}
        <span className="day-summary">
          {/* First, so a long weather summary can't push it out of sight. */}
          {aurora.size > 0 && (
            <span className="aurora-badge" title="Northern lights possible">
              <Icon name="aurora" size={14} />
            </span>
          )}
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
          const kp = aurora.get(hour)
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
                {kp !== undefined && (
                  <span
                    className={`aurora-reading aurora-reading--${auroraLevel(kp)}`}
                    title={`Kp ${formatKp(kp)}`}
                    aria-label={`Northern lights possible, ${AURORA_LEVEL_NAMES[
                      auroraLevel(kp)
                    ].toLowerCase()} aurora level, Kp ${formatKp(kp)}`}
                  >
                    <Icon name="aurora" size={11} />
                    {AURORA_LEVEL_NAMES[auroraLevel(kp)]}
                  </span>
                )}
              </span>
            </div>
          )
        })}
        <div className="events-layer">
          {groups.map((group) => {
            const groupEvents = group.events.map((index) => events[index])
            return (
              <EventCard
                events={groupEvents}
                start={group.start}
                end={group.end}
                view={view}
                calendarOf={calendarOf}
                onOpen={() => onOpenEvents(groupEvents)}
                key={`${groupEvents[0].title}-${group.start}-${group.events[0]}`}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [view, setView] = useState<ViewMode>("week")
  const [showWeather, setShowWeather] = useState(true)
  const [showPrices, setShowPrices] = useState(true)
  const [showAurora, setShowAurora] = useState(true)
  const today = useToday()
  // null means "follow today", so the calendar moves on by itself when the date changes.
  const [pickedDate, setPickedDate] = useState<string | null>(null)
  const selectedDate = pickedDate ?? today
  // The sample events are only shown until Google Calendar is connected.
  const calendarEvents = useMemo(() => sampleEvents(today), [today])
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false)
  // The event card whose details are open, if any.
  const [openEvents, setOpenEvents] = useState<{
    day: CalendarDay
    events: Event[]
  } | null>(null)
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
  // The Kp forecast covers about three days from now; the place, darkness and clouds decide what is shown.
  const aurora = useAurora()
  const neededKp = location
    ? kpNeeded(location.latitude, location.longitude)
    : null

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
  const auroraOn = (iso: string): Map<number, number> =>
    showAurora
      ? auroraHours(
          aurora.kp?.byDate[iso],
          weatherByDate.get(iso)?.hours,
          neededKp,
        )
      : new Map()
  // The banner only looks at this evening's hours still to come (dark mornings in Lapland are not "tonight").
  const fromHour = Math.max(new Date().getHours(), 12)
  const tonight = [...auroraOn(today)].find(([hour]) => hour >= fromHour)
  // The legend lists only the levels shown on screen, from low to high.
  const levelsInView = (["low", "moderate", "high"] as AuroraLevel[]).filter(
    (level) =>
      visibleDays.some((day) =>
        [...auroraOn(day.iso).values()].some((kp) => auroraLevel(kp) === level),
      ),
  )
  // Once Google Calendar is connected its events replace the sample events.
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src={logo} alt="" />
          <span>Week at a Glance</span>
        </div>
        <div className="topbar-actions">
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
        <ThemeToggle />
        </div>
      </header>

      {!googleConnected && (
        <SampleNotice
          configured={google.configured}
          onOpenSettings={() => setCalendarDialogOpen(true)}
        />
      )}
      {googleConnected && google.needsSignIn && (
        <SignInNotice onReconnect={google.reconnect} />
      )}
      {tonight && <AuroraNotice from={tonight[0]} kp={tonight[1]} />}

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
            <Toggle
              checked={showAurora}
              onChange={() => setShowAurora((value) => !value)}
            >
              <Icon name="aurora" size={16} /> Northern lights
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
                {`< ${LOW_PRICE}`}
                <span className="price-trend price-trend--low">
                  <Icon name="arrow-down" size={10} />
                </span>
              </b>
              <b className="price-high">
                {`${HIGH_PRICE}<`}
                <span className="price-trend price-trend--high">
                  <Icon name="arrow-up" size={10} />
                </span>
              </b>
            </>
          )}
          {showAurora && neededKp !== null && (
            <span className="aurora-legend">
              <span className="aurora-key">
                <Icon name="aurora" size={12} />
                Aurora level
              </span>
              {levelsInView.length === 0 && <span>None</span>}
              {levelsInView.map((level) => (
                <span
                  className={`aurora-reading aurora-reading--${level}`}
                  key={level}
                >
                  {AURORA_LEVEL_NAMES[level]}
                </span>
              ))}
            </span>
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
              aurora={auroraOn(day.iso)}
              key={day.iso}
              onSelect={() => {
                setPickedDate(day.iso)
                if (window.innerWidth < 700) setView("day")
              }}
              isToday={day.iso === today}
              selected={view === "week" && day.iso === selectedDate}
              showPrices={showPrices}
              showWeather={showWeather}
              view={view}
              onOpenEvents={(events) => setOpenEvents({ day, events })}
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

      {showAurora && (
        <AuroraStatus
          hasLocation={location !== null}
          neededKp={neededKp}
          tooFarSouth={location !== null && neededKp === null}
          loading={aurora.status === "loading"}
          error={aurora.error}
          saved={aurora.saved}
          fetchedAt={aurora.kp?.fetchedAt ?? null}
          onRetry={aurora.reload}
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

      {openEvents && (
        <EventDialog
          dayLabel={`${openEvents.day.short} ${openEvents.day.date} ${openEvents.day.month}`}
          events={openEvents.events}
          calendarOf={(event) =>
            calendarsById.get(event.calendarId) ?? SAMPLE_CALENDAR
          }
          onClose={() => setOpenEvents(null)}
        />
      )}
    </main>
  )
}
