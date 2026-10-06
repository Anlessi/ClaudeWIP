import { useEffect, useState } from "react"
import Icon from "./Icon"
import { searchPlaces, type Place, type SavedLocation } from "./weather"

export default function LocationDialog({
  current,
  onSelect,
  onClose,
}: {
  current: SavedLocation | null
  onSelect: (location: SavedLocation) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Place[]>([])
  const [searching, setSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState("")

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  useEffect(() => {
    const text = query.trim()
    if (text.length < 2) {
      setResults([])
      setSearching(false)
      setSearchMessage("")
      return
    }

    const controller = new AbortController()
    setSearching(true)
    const timer = setTimeout(() => {
      searchPlaces(text, controller.signal)
        .then((places) => {
          setResults(places)
          setSearchMessage(places.length ? "" : `No places found for "${text}".`)
          setSearching(false)
        })
        .catch(() => {
          if (controller.signal.aborted) return
          setResults([])
          setSearchMessage(
            "Couldn't search for places. Check your connection and try again.",
          )
          setSearching(false)
        })
    }, 350)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

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
        aria-labelledby="location-dialog-title"
      >
        <div className="editor-heading">
          <div>
            <p className="eyebrow">Weather</p>
            <h2 id="location-dialog-title">Set your location</h2>
          </div>
          <button
            type="button"
            className="editor-close"
            aria-label="Close location settings"
            onClick={onClose}
          >
            <Icon name="x" size={19} />
          </button>
        </div>

        <div className="location-body">
          <p className="location-note">
            The calendar shows the hourly forecast for this place.
            {current ? ` Now: ${current.name}.` : ""}
          </p>

          <label className="field">
            <span>Search for a city or town</span>
            <input
              autoFocus
              value={query}
              placeholder="e.g. Helsinki"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {searching && <p className="location-note">Searching…</p>}
          {!searching && searchMessage && (
            <p className="location-note location-note--error" role="status">
              {searchMessage}
            </p>
          )}
          {results.length > 0 && (
            <ul className="location-results">
              {results.map((place) => (
                <li key={`${place.latitude},${place.longitude},${place.name}`}>
                  <button
                    type="button"
                    className="location-result"
                    onClick={() =>
                      onSelect({
                        name: place.name,
                        latitude: place.latitude,
                        longitude: place.longitude,
                      })
                    }
                  >
                    <Icon name="pin" size={17} />
                    <span>
                      <strong>{place.name}</strong>
                      {place.detail && <small>{place.detail}</small>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="location-privacy">
            The place you search for and its approximate coordinates are sent
            to Open-Meteo to get the weather. Your choice is saved only in this
            browser.
          </p>
        </div>

        <div className="editor-actions">
          <span />
          <div>
            <button type="button" className="cancel-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
