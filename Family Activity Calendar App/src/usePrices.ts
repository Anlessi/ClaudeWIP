import { useEffect, useState } from "react"
import {
  fetchPrices,
  loadCachedPrices,
  saveCachedPrices,
  type PriceTable,
} from "./electricity"

type Status = "loading" | "ready" | "error"

type State = {
  status: Status
  prices: PriceTable | null
  /** True when `prices` is a saved copy from an earlier visit, not freshly downloaded. */
  saved: boolean
  error: string
}

// Tomorrow's prices are published in the early afternoon, so look again regularly while the app is open.
const REFRESH_EVERY_MS = 30 * 60 * 1000

/**
 * Loads the electricity prices for the dates from `firstDate` to `lastDate`. While they download, or if
 * they can't be downloaded, the last saved prices for the same dates are shown instead.
 */
export default function usePrices(firstDate: string, lastDate: string) {
  const [state, setState] = useState<State>({
    status: "loading",
    prices: null,
    saved: false,
    error: "",
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const saved = loadCachedPrices(firstDate, lastDate)
    setState({ status: "loading", prices: saved, saved: !!saved, error: "" })

    const controller = new AbortController()
    fetchPrices(firstDate, lastDate, controller.signal)
      .then((prices) => {
        saveCachedPrices(firstDate, lastDate, prices)
        setState({ status: "ready", prices, saved: false, error: "" })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: "error",
          prices: saved,
          saved: !!saved,
          error:
            error instanceof TypeError
              ? "Couldn't reach the electricity price service."
              : error instanceof Error
                ? error.message
                : "Couldn't load the electricity prices.",
        })
      })

    return () => controller.abort()
  }, [firstDate, lastDate, attempt])

  useEffect(() => {
    const reload = () => setAttempt((count) => count + 1)
    const isStale = () =>
      state.status === "error" ||
      (state.prices !== null &&
        !state.saved &&
        Date.now() - state.prices.fetchedAt > REFRESH_EVERY_MS)

    const onVisible = () => {
      if (document.visibilityState === "visible" && isStale()) reload()
    }
    const onOnline = () => {
      if (state.status === "error") reload()
    }
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") reload()
    }, REFRESH_EVERY_MS)

    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onOnline)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onOnline)
    }
  }, [state])

  return { ...state, reload: () => setAttempt((count) => count + 1) }
}
