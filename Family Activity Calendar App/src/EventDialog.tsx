import { useEffect } from "react"
import Icon from "./Icon"
import { formatTime, type CalendarSource, type Event } from "./events"

/** Shows the details of an event card: its event and any events that overlap it. Read-only (0011). */
export default function EventDialog({
  dayLabel,
  events,
  calendarOf,
  onClose,
}: {
  /** The day the events are on, e.g. "Tue 14 October". */
  dayLabel: string
  /** Earliest first, as on the card. */
  events: Event[]
  calendarOf: (event: Event) => CalendarSource
  onClose: () => void
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="event-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-dialog-title"
      >
        <div className="editor-heading">
          <div>
            <p className="eyebrow">{dayLabel}</p>
            <h2 id="event-dialog-title">
              {events.length === 1
                ? events[0].title
                : `${events.length} events at the same time`}
            </h2>
          </div>
          <button
            type="button"
            className="editor-close"
            aria-label="Close event details"
            onClick={onClose}
          >
            <Icon name="x" size={19} />
          </button>
        </div>

        <ul className="event-details">
          {events.map((event, index) => {
            const calendar = calendarOf(event)
            return (
              <li key={`${event.title}-${event.start}-${index}`}>
                <span
                  className="event-details-swatch"
                  style={{ background: calendar.color }}
                />
                <span>
                  <strong>{event.title}</strong>
                  <span className="event-details-time">
                    {formatTime(event.start)}–
                    {formatTime(event.start + event.duration)}
                  </span>
                  <small>{calendar.name}</small>
                  {event.note && (
                    <span className="event-details-note">{event.note}</span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="editor-actions">
          <span />
          <button type="button" className="cancel-button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  )
}
