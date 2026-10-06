import { useEffect, useState } from "react"
import Icon from "./Icon"
import { GoogleAuthError } from "./googleAuth"
import type { CalendarSource } from "./events"
import { fetchCalendarList, type GoogleCalendarInfo } from "./googleCalendar"

function describeFailure(failure: unknown) {
  if (failure instanceof GoogleAuthError) {
    switch (failure.reason) {
      case "popup_closed":
        return "The Google window was closed before signing in finished."
      case "popup_failed_to_open":
        return "The browser blocked the Google window. Allow pop-ups for this site and try again."
      case "access_denied":
        return "Google Calendar access wasn't allowed."
      case "script_blocked":
        return "Couldn't load Google's sign-in. Check your connection or ad blocker and try again."
      default:
        return `${failure.message} Try again.`
    }
  }
  return failure instanceof TypeError
    ? "Couldn't reach Google Calendar. Check your connection and try again."
    : "Couldn't load your calendars. Try again."
}

export default function CalendarDialog({
  configured,
  current,
  ensureToken,
  onSelect,
  onDisconnect,
  onClose,
}: {
  /** False when the app has no Google client ID. */
  configured: boolean
  /** The calendars being shown now; empty when nothing is connected. */
  current: CalendarSource[]
  /** Signs in to Google if needed (this runs from a click, so Google may open its window). */
  ensureToken: (interactive: boolean) => Promise<string>
  onSelect: (calendars: CalendarSource[]) => void
  onDisconnect: () => void
  onClose: () => void
}) {
  const [calendars, setCalendars] = useState<GoogleCalendarInfo[] | null>(null)
  const [chosen, setChosen] = useState<Set<string>>(
    () => new Set(current.map((calendar) => calendar.id)),
  )
  const connected = current.length > 0
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  const showCalendars = async () => {
    setWorking(true)
    setMessage("")
    try {
      const accessToken = await ensureToken(true)
      setCalendars(await fetchCalendarList(accessToken))
    } catch (failure) {
      setMessage(describeFailure(failure))
    } finally {
      setWorking(false)
    }
  }

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
        aria-labelledby="calendar-dialog-title"
      >
        <div className="editor-heading">
          <div>
            <p className="eyebrow">Google Calendar</p>
            <h2 id="calendar-dialog-title">
              {connected ? "Your calendars" : "Connect your calendar"}
            </h2>
          </div>
          <button
            type="button"
            className="editor-close"
            aria-label="Close calendar settings"
            onClick={onClose}
          >
            <Icon name="x" size={19} />
          </button>
        </div>

        <div className="location-body">
          {!configured && (
            <p className="location-note location-note--error" role="status">
              This copy of the app isn&apos;t set up for Google Calendar yet.
              Add a Google client ID as VITE_GOOGLE_CLIENT_ID in .env.local; the
              README explains how.
            </p>
          )}

          {configured && calendars === null && (
            <>
              <p className="location-note">
                {connected
                  ? `Showing events from ${current.map((c) => `"${c.name}"`).join(", ")}.`
                  : "Show the real events from your Google calendars instead of the sample events."}
              </p>
              <p className="location-note">
                The app can only read your calendars; it can&apos;t add, change
                or delete anything. Each calendar keeps its Google name and
                colour.
              </p>
            </>
          )}

          {message && (
            <p className="location-note location-note--error" role="status">
              {message}
            </p>
          )}

          {calendars !== null && (
            <>
              <p className="location-note">
                {calendars.length === 0
                  ? "This Google account has no calendars to show."
                  : "Choose the calendars to show:"}
              </p>
              <ul className="location-results">
                {calendars.map((calendar) => {
                  const checked = chosen.has(calendar.id)
                  return (
                    <li key={calendar.id}>
                      <button
                        type="button"
                        className="location-result"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() =>
                          setChosen((previous) => {
                            const next = new Set(previous)
                            if (checked) next.delete(calendar.id)
                            else next.add(calendar.id)
                            return next
                          })
                        }
                      >
                        <span
                          className="calendar-swatch"
                          style={{
                            background: checked ? calendar.color : "transparent",
                            borderColor: calendar.color,
                            color: calendar.textColor,
                          }}
                        >
                          {checked && <Icon name="check" size={13} />}
                        </span>
                        <span>
                          <strong>{calendar.name}</strong>
                          {calendar.primary && <small>Your main calendar</small>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          <p className="location-privacy">
            Events are loaded straight from Google into this browser. The
            Google sign-in is never saved, and only your choice of calendars is
            remembered in this browser.
          </p>
        </div>

        <div className="editor-actions">
          {connected ? (
            <button
              type="button"
              className="delete-event-button"
              onClick={() => {
                onDisconnect()
                onClose()
              }}
            >
              Disconnect
            </button>
          ) : (
            <span />
          )}
          <div>
            <button type="button" className="cancel-button" onClick={onClose}>
              Close
            </button>
            {configured && calendars === null && (
              <button
                type="button"
                className="save-event-button"
                disabled={working}
                onClick={showCalendars}
              >
                {working
                  ? "Connecting…"
                  : connected
                    ? "Change calendars"
                    : "Connect Google Calendar"}
              </button>
            )}
            {calendars !== null && (
              <button
                type="button"
                className="save-event-button"
                disabled={chosen.size === 0}
                onClick={() => {
                  onSelect(
                    calendars
                      .filter(({ id }) => chosen.has(id))
                      .map(({ id, name, color, textColor }) => ({
                        id,
                        name,
                        color,
                        textColor,
                      })),
                  )
                  onClose()
                }}
              >
                Show these calendars
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
