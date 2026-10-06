import { useMemo, useState, type ReactNode } from "react"

type ViewMode = "day" | "week"
type WeatherKind = "sunny" | "cloudy" | "rain"
type Person = "Mum" | "Dad" | "Mia" | "Leo" | "Family"

type Event = {
  title: string
  start: number
  duration: number
  person: Person
  note?: string
}

type EventDraft = Event & {
  dayIndex: number
}

type Day = {
  short: string
  date: number
  summary: string
  high: number
  low: number
  weather: WeatherKind
  weatherByPeriod: [WeatherKind, WeatherKind, WeatherKind]
  events: Event[]
}

const START_HOUR = 7
const END_HOUR = 21
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, index) => START_HOUR + index,
)

const DAYS: Day[] = [
  {
    short: "Mon",
    date: 5,
    summary: "Rain after 17:00",
    high: 10,
    low: 6,
    weather: "rain",
    weatherByPeriod: ["cloudy", "sunny", "rain"],
    events: [
      { title: "Dentist", start: 8, duration: 1, person: "Dad" },
      { title: "Team meeting", start: 9, duration: 1, person: "Mum" },
      { title: "Piano", start: 16, duration: 1, person: "Mia" },
      {
        title: "Football",
        start: 17,
        duration: 1.5,
        person: "Leo",
        note: "Bring raincoat",
      },
    ],
  },
  {
    short: "Tue",
    date: 6,
    summary: "Cloudy",
    high: 11,
    low: 6,
    weather: "cloudy",
    weatherByPeriod: ["cloudy", "sunny", "cloudy"],
    events: [
      { title: "Pick up Leo", start: 15, duration: 1, person: "Mum" },
      { title: "Late shift", start: 17, duration: 3, person: "Dad" },
    ],
  },
  {
    short: "Wed",
    date: 7,
    summary: "Sunny start",
    high: 12,
    low: 5,
    weather: "sunny",
    weatherByPeriod: ["sunny", "cloudy", "cloudy"],
    events: [
      { title: "Dentist", start: 9, duration: 1, person: "Leo" },
      { title: "Swim", start: 17, duration: 1, person: "Mia" },
      { title: "Yoga", start: 18, duration: 1, person: "Mum" },
    ],
  },
  {
    short: "Thu",
    date: 8,
    summary: "Rain all day",
    high: 9,
    low: 7,
    weather: "rain",
    weatherByPeriod: ["rain", "rain", "rain"],
    events: [
      {
        title: "Choir",
        start: 16,
        duration: 1,
        person: "Mia",
        note: "Heavy rain",
      },
      { title: "Football", start: 17, duration: 1.5, person: "Leo" },
      { title: "Parent meeting", start: 18.5, duration: 1.5, person: "Dad" },
    ],
  },
  {
    short: "Fri",
    date: 9,
    summary: "Sunny spells",
    high: 12,
    low: 6,
    weather: "sunny",
    weatherByPeriod: ["cloudy", "sunny", "cloudy"],
    events: [
      { title: "Gym", start: 7, duration: 1, person: "Dad" },
      { title: "Sleepover", start: 17, duration: 2, person: "Mia" },
      { title: "Book club", start: 19, duration: 2, person: "Mum" },
    ],
  },
  {
    short: "Sat",
    date: 10,
    summary: "Early showers",
    high: 12,
    low: 7,
    weather: "rain",
    weatherByPeriod: ["rain", "sunny", "sunny"],
    events: [
      { title: "Market", start: 8, duration: 1.5, person: "Mum" },
      { title: "Match", start: 10, duration: 2, person: "Leo" },
      { title: "Party", start: 11, duration: 2, person: "Mia" },
    ],
  },
  {
    short: "Sun",
    date: 11,
    summary: "Sunny",
    high: 13,
    low: 6,
    weather: "sunny",
    weatherByPeriod: ["sunny", "sunny", "cloudy"],
    events: [
      { title: "Run", start: 9, duration: 1, person: "Dad" },
      { title: "Family lunch", start: 13, duration: 2, person: "Family" },
      { title: "Meal prep", start: 17, duration: 1, person: "Mum" },
    ],
  },
]

const PERSON_COLORS: Record<Person, string> = {
  Mum: "var(--mum)",
  Dad: "var(--dad)",
  Mia: "var(--mia)",
  Leo: "var(--leo)",
  Family: "var(--family)",
}

const PRICES = [11, 14, 12, 9, 7, 6, 5, 5, 6, 9, 13, 15, 12, 9]

function Icon({
  name,
  size = 18,
}: {
  name: "calendar" | "chevron-left" | "chevron-right" | "cloud" | "sun" | "rain" | "bolt" | "check" | "arrow-up" | "arrow-down" | "plus" | "x" | "trash"
  size?: number
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
      </svg>
    )
  }
  if (name === "chevron-left")
    return (
      <svg {...common}>
        <path d="m15 18-6-6 6-6" />
      </svg>
    )
  if (name === "chevron-right")
    return (
      <svg {...common}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    )
  if (name === "sun") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
      </svg>
    )
  }
  if (name === "rain") {
    return (
      <svg {...common}>
        <path d="M7 16h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 7.5 4.5 4.5 0 0 0 7 16Z" />
        <path d="m8 19-1 2M13 19l-1 2M18 19l-1 2" />
      </svg>
    )
  }
  if (name === "bolt")
    return (
      <svg {...common}>
        <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />
      </svg>
    )
  if (name === "check")
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    )
  if (name === "arrow-up")
    return (
      <svg {...common}>
        <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />
      </svg>
    )
  if (name === "arrow-down")
    return (
      <svg {...common}>
        <path d="M12 5v14M17.5 13.5 12 19l-5.5-5.5" />
      </svg>
    )
  if (name === "plus")
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  if (name === "x")
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    )
  if (name === "trash")
    return (
      <svg {...common}>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M7 17h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 8.5 4.5 4.5 0 0 0 7 17Z" />
    </svg>
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

function WeatherIcon({ kind, size = 18 }: { kind: WeatherKind; size?: number }) {
  const iconName =
    kind === "sunny" ? "sun" : kind === "cloudy" ? "cloud" : "rain"
  return <Icon name={iconName} size={size} />
}

function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const style = {
    "--event-top": `${(event.start - START_HOUR) * 64 + 4}px`,
    "--event-height": `${event.duration * 64 - 8}px`,
    "--event-color": PERSON_COLORS[event.person],
  } as React.CSSProperties

  return (
    <Button
      className="event-card"
      style={style}
      label={`Edit ${event.title} at ${formatTime(event.start)}`}
      onClick={onClick}
    >
      <strong>{event.title}</strong>
      <span>{formatTime(event.start)}</span>
      {event.note && <small>{event.note}</small>}
    </Button>
  )
}

function formatTime(hour: number) {
  const whole = Math.floor(hour)
  const minutes = hour % 1 === 0 ? "00" : "30"
  return `${String(whole).padStart(2, "0")}:${minutes}`
}

function DayColumn({
  day,
  dayIndex,
  events,
  showWeather,
  showPrices,
  selected,
  onEditEvent,
  onSelect,
}: {
  day: Day
  dayIndex: number
  events: Event[]
  showWeather: boolean
  showPrices: boolean
  selected: boolean
  onEditEvent: (eventIndex: number) => void
  onSelect: () => void
}) {
  return (
    <section className={`day-column ${selected ? "day-column--selected" : ""}`}>
      <Button
        className="day-heading"
        onClick={onSelect}
        label={`Show ${day.short} ${day.date}`}
      >
        <span className="day-name">{day.short}</span>
        <span className="day-date">{day.date}</span>
        {selected && <span className="today-label">Today</span>}
        <span className="day-summary">
          {showWeather && <WeatherIcon kind={day.weather} size={15} />}
          {day.high}° / {day.low}° · {day.summary}
        </span>
      </Button>

      <div className="day-body">
        {HOURS.map((hour, rowIndex) => {
          const period = rowIndex < 5 ? 0 : rowIndex < 10 ? 1 : 2
          const weather = day.weatherByPeriod[period]
          const price = Math.max(1, PRICES[rowIndex] - (dayIndex % 3))
          const temperature = Math.round(
            day.low + ((day.high - day.low) * (9 - Math.abs(13 - hour))) / 9,
          )
          return (
            <div
              className={`hour-cell ${showWeather ? `weather-${weather}` : ""}`}
              key={hour}
            >
              <span className="cell-data">
                {showWeather && (
                  <span className="weather-reading">
                    <WeatherIcon kind={weather} size={15} />
                    {temperature}°
                  </span>
                )}
                {showPrices && (
                  <span
                    className={`price-reading ${
                      price >= 15
                        ? "price-reading--high"
                        : price <= 3
                          ? "price-reading--low"
                          : ""
                    }`}
                    aria-label={`${price} cents per kilowatt hour${
                      price >= 15
                        ? ", high price"
                        : price <= 3
                          ? ", low price"
                          : ""
                    }`}
                  >
                    <Icon name="bolt" size={11} />
                    {price}
                    {price >= 15 && (
                      <span className="price-trend price-trend--high">
                        <Icon name="arrow-up" size={10} />
                      </span>
                    )}
                    {price <= 3 && (
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
              key={`${event.title}-${event.start}-${eventIndex}`}
              onClick={() => onEditEvent(eventIndex)}
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
  const [selectedDay, setSelectedDay] = useState(0)
  const [calendarEvents, setCalendarEvents] = useState<Event[][]>(() =>
    DAYS.map((day) => [...day.events]),
  )
  const [editingEvent, setEditingEvent] = useState<{
    dayIndex: number
    eventIndex: number
  } | null>(null)
  const [draft, setDraft] = useState<EventDraft | null>(null)

  const visibleDays = useMemo(
    () => (view === "day" ? [DAYS[selectedDay]] : DAYS),
    [view, selectedDay],
  )

  const moveDay = (direction: number) => {
    setSelectedDay(
      (current) => (current + direction + DAYS.length) % DAYS.length,
    )
  }

  const openNewEvent = () => {
    setEditingEvent(null)
    setDraft({
      title: "",
      dayIndex: selectedDay,
      start: 9,
      duration: 1,
      person: "Mum",
      note: "",
    })
  }

  const openExistingEvent = (dayIndex: number, eventIndex: number) => {
    setEditingEvent({ dayIndex, eventIndex })
    setDraft({
      ...calendarEvents[dayIndex][eventIndex],
      dayIndex,
    })
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
      person: draft.person,
      note: draft.note?.trim(),
    }

    setCalendarEvents((current) => {
      const next = current.map((events) => [...events])
      if (editingEvent) {
        next[editingEvent.dayIndex].splice(editingEvent.eventIndex, 1)
      }
      next[draft.dayIndex].push(nextEvent)
      next[draft.dayIndex].sort((a, b) => a.start - b.start)
      return next
    })
    setSelectedDay(draft.dayIndex)
    closeEditor()
  }

  const deleteEvent = () => {
    if (!editingEvent) return
    setCalendarEvents((current) =>
      current.map((events, dayIndex) =>
        dayIndex === editingEvent.dayIndex
          ? events.filter((_, index) => index !== editingEvent.eventIndex)
          : events,
      ),
    )
    closeEditor()
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="calendar" size={21} />
          </span>
          <span>Family Flow</span>
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
          <p className="eyebrow">Family calendar</p>
          <div className="title-row">
            <h1>
              {view === "week"
                ? "Week at a glance"
                : `${DAYS[selectedDay].short}, October ${DAYS[selectedDay].date}`}
            </h1>
            <span className="date-range">
              {view === "week" ? "5–11 October 2026" : "2026"}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <div className="date-nav">
            <Button
              className="icon-button"
              label="Previous day"
              onClick={() => moveDay(-1)}
            >
              <Icon name="chevron-left" />
            </Button>
            <Button className="today-button" onClick={() => setSelectedDay(0)}>
              Today
            </Button>
            <Button
              className="icon-button"
              label="Next day"
              onClick={() => moveDay(1)}
            >
              <Icon name="chevron-right" />
            </Button>
          </div>
          <div className="filters" aria-label="Calendar layers">
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
            <Button className="add-event-button" onClick={openNewEvent}>
              <Icon name="plus" size={16} /> Add event
            </Button>
          </div>
        </div>
      </section>

      <section className="legend-bar">
        <div className="people-legend">
          {(Object.keys(PERSON_COLORS) as Person[]).map((person) => (
            <span className="legend-item" key={person}>
              <i style={{ background: PERSON_COLORS[person] }} />
              {person}
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
            </span>
          )}
          {showPrices && (
            <>
              <span className="price-legend-label">
                <Icon name="bolt" size={12} />
                Price c/kWh
              </span>
              <b className="price-low">
                3 or below
                <span className="price-trend price-trend--low">
                  <Icon name="arrow-down" size={10} />
                </span>
              </b>
              <b className="price-high">
                15+
                <span className="price-trend price-trend--high">
                  <Icon name="arrow-up" size={10} />
                </span>
              </b>
            </>
          )}
        </div>
      </section>

      <section className="schedule-frame">
        <div className="time-column">
          <div className="time-heading">GMT+2</div>
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
              dayIndex={DAYS.indexOf(day)}
              events={calendarEvents[DAYS.indexOf(day)]}
              key={day.short}
              onEditEvent={(eventIndex) =>
                openExistingEvent(DAYS.indexOf(day), eventIndex)
              }
              onSelect={() => {
                setSelectedDay(DAYS.indexOf(day))
                if (window.innerWidth < 700) setView("day")
              }}
              selected={DAYS.indexOf(day) === selectedDay}
              showPrices={showPrices}
              showWeather={showWeather}
            />
          ))}
        </div>
      </section>

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
                  value={draft.dayIndex}
                  onChange={(event) =>
                    setDraft({ ...draft, dayIndex: Number(event.target.value) })
                  }
                >
                  {DAYS.map((day, index) => (
                    <option value={index} key={day.short}>
                      {day.short}, October {day.date}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Family member</span>
                <select
                  value={draft.person}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      person: event.target.value as Person,
                    })
                  }
                >
                  {(Object.keys(PERSON_COLORS) as Person[]).map((person) => (
                    <option value={person} key={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Starts at</span>
                <input
                  type="time"
                  min="07:00"
                  max="20:30"
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
