import { useEffect } from "react"
import Icon from "./Icon"

/** What the app is and how to support the developer, opened from the top bar's About button (0030). */
export default function AboutDialog({ onClose }: { onClose: () => void }) {
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
        aria-labelledby="about-dialog-title"
      >
        <div className="editor-heading">
          <h2 id="about-dialog-title">About</h2>
          <button
            type="button"
            className="editor-close"
            aria-label="Close About"
            onClick={onClose}
          >
            <Icon name="x" size={19} />
          </button>
        </div>

        <div className="about-body">
          <p>
            Week at a Glance is developed by an engineer as a hobby. The purpose
            is to provide a better calendar experience by bringing together
            calendar events, the weather for location, electricity prices
            (Finland only) and northern lights alerts. Currently only Google
            Calendar can be connected to the app, and the events can only be
            viewed (read only).
          </p>

          <h3>How to support the developer</h3>
          <p>
            Support my development on Ko-fi by buying my <em>Develop with AI</em>{" "}
            guide.
          </p>
          {/* Placeholder until the Ko-fi page exists; becomes a link then. */}
          <p className="about-placeholder">Ko-fi link coming soon</p>

          <h3>Your data and privacy</h3>
          <p>
            Week at a Glance has no server and no user accounts. Your calendar
            data never passes through or gets stored by the developer.
          </p>
          <ul>
            <li>
              <strong>Google Calendar:</strong> The app can only read your
              calendars. It can’t change them. Your events go straight from
              Google to your browser and are not saved. Google’s sign-in
              permission lasts about an hour and is only kept while the page is
              open. You can remove the app’s access at any time in your Google
              Account under Security → Third-party connections.
            </li>
            <li>
              <strong>Saved on your device:</strong> Your chosen place, the
              names and colours of your calendars, your theme, and recent
              weather, price and northern lights data are saved in your browser so the app loads
              quickly. Clearing your browser’s site data removes them.
            </li>
            <li>
              <strong>Outside services:</strong> To get the weather, the app
              sends your chosen place to Open-Meteo. It also fetches electricity
              prices from sahkotin.fi and northern lights forecasts from NOAA.
              None of these are sent any personal information, though like any
              website they can see your device’s IP address.
            </li>
            <li>
              <strong>Visit statistics:</strong> The app uses Vercel Web
              Analytics and Speed Insights. They count visits and measure
              loading speed without cookies and without identifying you.
            </li>          </ul>
        </div>

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
