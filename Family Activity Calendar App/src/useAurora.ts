import { useEffect, useState } from "react"
import { fetchKp, loadCachedKp, saveCachedKp, type KpTable } from "./aurora"

type Status = "loading" | "ready" | "error"

type State = {
  status: Status
  kp: KpTable | null
  /** True when `kp` is a saved copy from an earlier visit, not freshly downloaded. */
  saved: boolean
  error: string
}

// NOAA updates the forecast a few times a day.
const REFRESH_EVERY_MS = 3 * 60 * 60 * 1000

/**
 * Loads the Kp forecast for the next three days. While it downloads, or if it can't be downloaded, the last
 * saved forecast is shown instead.
 */
export default function useAurora() {
  const [state, setState] = useState<State>({
    status: "loading",
    kp: null,
    saved: false,
    error: "",
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const saved = loadCachedKp()
    setState({ status: "loading", kp: saved, saved: !!saved, error: "" })

    const controller = new AbortController()
    fetchKp(controller.signal)
      .then((kp) => {
        saveCachedKp(kp)
        setState({ status: "ready", kp, saved: false, error: "" })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: "error",
          kp: saved,
          saved: !!saved,
          error:
            error instanceof TypeError
              ? "Couldn't reach the space weather service."
              : error instanceof Error
                ? error.message
                : "Couldn't load the northern lights forecast.",
        })
      })

    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    const reload = () => setAttempt((count) => count + 1)
    const isStale = () =>
      state.status === "error" ||
      (state.kp !== null &&
        !state.saved &&
        Date.now() - state.kp.fetchedAt > REFRESH_EVERY_MS)

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
