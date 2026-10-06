import { useEffect, useState } from "react"
import { localIsoDate, msUntilNextMidnight } from "./dates"

/**
 * Today's date on the device ("2026-10-06"). It changes by itself when midnight passes while the app
 * is open, and is rechecked when the app comes back into view (timers don't run while a device sleeps).
 */
export default function useToday() {
  const [today, setToday] = useState(() => localIsoDate())

  useEffect(() => {
    const refresh = () => setToday(localIsoDate())

    let timer: ReturnType<typeof setTimeout>
    const scheduleMidnightRefresh = () => {
      timer = setTimeout(() => {
        refresh()
        scheduleMidnightRefresh()
      }, msUntilNextMidnight())
    }
    scheduleMidnightRefresh()

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", refresh)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", refresh)
    }
  }, [])

  return today
}
