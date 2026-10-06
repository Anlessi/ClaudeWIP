import { useEffect, useState } from "react"
import {
  fetchForecast,
  loadCachedForecast,
  saveCachedForecast,
  type Forecast,
  type SavedLocation,
} from "./weather"

type Status = "idle" | "loading" | "ready" | "error"

type State = {
  status: Status
  forecast: Forecast | null
  /** True when `forecast` is a saved copy from an earlier visit, not fresh data. */
  saved: boolean
  error: string
}

const IDLE: State = { status: "idle", forecast: null, saved: false, error: "" }

// The forecast changes through the day, so reload it when the app is opened again after this long.
const REFRESH_AFTER_MS = 30 * 60 * 1000

/**
 * Loads the hourly forecast for a location. While the new forecast downloads, or if it can't be
 * downloaded, the last saved forecast for the same place and week is shown instead.
 */
export default function useForecast(
  location: SavedLocation | null,
  weekDates: string[],
  firstHour: number,
  endHour: number,
) {
  const [state, setState] = useState<State>(IDLE)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!location) {
      setState(IDLE)
      return
    }

    const saved = loadCachedForecast(location, weekDates)
    setState({ status: "loading", forecast: saved, saved: !!saved, error: "" })

    const controller = new AbortController()
    fetchForecast(location, weekDates, firstHour, endHour, controller.signal)
      .then((forecast) => {
        saveCachedForecast(location, weekDates, forecast)
        setState({ status: "ready", forecast, saved: false, error: "" })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: "error",
          forecast: saved,
          saved: !!saved,
          error:
            error instanceof TypeError
              ? "Couldn't reach the weather service."
              : error instanceof Error
                ? error.message
                : "Couldn't load the weather.",
        })
      })

    return () => controller.abort()
  }, [location, weekDates, firstHour, endHour, attempt])

  useEffect(() => {
    const reload = () => setAttempt((count) => count + 1)
    const isStale =
      state.status === "error" ||
      (state.forecast !== null &&
        !state.saved &&
        Date.now() - state.forecast.fetchedAt > REFRESH_AFTER_MS)

    const onVisible = () => {
      if (document.visibilityState === "visible" && location && isStale) {
        reload()
      }
    }
    const onOnline = () => {
      if (location && state.status === "error") reload()
    }

    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onOnline)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onOnline)
    }
  }, [location, state])

  return { ...state, reload: () => setAttempt((count) => count + 1) }
}
