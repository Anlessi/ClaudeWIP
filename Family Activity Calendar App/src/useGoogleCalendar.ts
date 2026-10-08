import { useCallback, useEffect, useRef, useState } from "react"
import {
  GOOGLE_CLIENT_ID,
  GoogleAuthError,
  requestAccessToken,
  revokeAccessToken,
  type AccessToken,
} from "./googleAuth"
import type { CalendarSource } from "./events"
import {
  GoogleAccessError,
  fetchCalendarList,
  fetchWeeks,
  loadSavedCalendars,
  refreshCalendars,
  saveCalendars,
  type GoogleWeek,
} from "./googleCalendar"

type Status = "idle" | "loading" | "ready" | "error"

// Events change while the app is open, so look again when it comes back into view after this long.
const REFRESH_AFTER_MS = 5 * 60 * 1000
const REFRESH_EVERY_MS = 10 * 60 * 1000
// Renew the sign-in a minute before it expires, so a request never goes out with a dead token.
const TOKEN_MARGIN_MS = 60 * 1000

/**
 * Loads the events of the chosen Google calendars for the week on screen. Until a calendar has been
 * chosen nothing is loaded. The Google sign-in only lasts about an hour and is never saved, so after the
 * app is reopened, and again an hour later, `needsSignIn` is true and the person has to press a button
 * (`reconnect`).
 */
export default function useGoogleCalendar(
  weekDates: string[],
  firstHour: number,
  endHour: number,
) {
  const [calendars, setCalendars] = useState<CalendarSource[]>(() =>
    GOOGLE_CLIENT_ID ? loadSavedCalendars() : [],
  )
  const [weeks, setWeeks] = useState<Record<string, GoogleWeek>>({})
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState("")
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const tokenRef = useRef<AccessToken | null>(null)
  const pendingToken = useRef<Promise<AccessToken> | null>(null)
  const weekKey = weekDates[0]

  /**
   * A working token. If the current one is gone or about to expire, a new one needs a Google window,
   * which browsers only allow after a click: so `interactive` must be true (called from a button), or
   * this fails and the person is asked to sign in.
   */
  const ensureToken = useCallback(async (interactive: boolean) => {
    const current = tokenRef.current
    if (current && current.expiresAt - TOKEN_MARGIN_MS > Date.now()) {
      return current.accessToken
    }
    if (!interactive) throw new GoogleAuthError("sign_in_needed")
    // One request at a time, so a double click can't open two windows.
    pendingToken.current ??= requestAccessToken().finally(() => {
      pendingToken.current = null
    })
    const next = await pendingToken.current
    tokenRef.current = next
    setNeedsSignIn(false)
    return next.accessToken
  }, [])

  useEffect(() => {
    if (calendars.length === 0) {
      setStatus("idle")
      return
    }

    const controller = new AbortController()
    setStatus("loading")

    const load = async () => {
      let accessToken: string
      try {
        accessToken = await ensureToken(false)
      } catch {
        if (controller.signal.aborted) return
        setNeedsSignIn(true)
        setStatus("idle")
        return
      }

      try {
        // Pick up colour and name changes made in Google. Best effort: if it fails, keep what is saved.
        // A change updates `calendars`, which restarts this effect once with the new colours.
        try {
          const latest = await fetchCalendarList(accessToken, controller.signal)
          const refreshed = refreshCalendars(calendars, latest)
          if (refreshed !== calendars) {
            saveCalendars(refreshed)
            setCalendars(refreshed)
            return
          }
        } catch (failure: unknown) {
          if (failure instanceof GoogleAccessError) throw failure
          if (controller.signal.aborted) return
        }

        const week = await fetchWeeks(
          accessToken,
          calendars,
          weekDates,
          firstHour,
          endHour,
          controller.signal,
        )
        setWeeks((current) => ({ ...current, [weekKey]: week }))
        setError("")
        setStatus("ready")
      } catch (failure: unknown) {
        if (controller.signal.aborted) return
        if (failure instanceof GoogleAccessError) {
          tokenRef.current = null
          setNeedsSignIn(true)
          setStatus("idle")
          return
        }
        setError(
          failure instanceof TypeError
            ? "Couldn't reach Google Calendar."
            : failure instanceof Error
              ? failure.message
              : "Couldn't load the calendar.",
        )
        setStatus("error")
      }
    }
    void load()

    return () => controller.abort()
  }, [calendars, weekDates, weekKey, firstHour, endHour, attempt, ensureToken])

  const week = weeks[weekKey] ?? null
  const fetchedAt = week?.fetchedAt ?? null

  useEffect(() => {
    if (calendars.length === 0) return
    const reload = () => setAttempt((count) => count + 1)
    const isStale = () =>
      status === "error" ||
      (fetchedAt !== null && Date.now() - fetchedAt > REFRESH_AFTER_MS)

    const onVisible = () => {
      if (document.visibilityState === "visible" && isStale()) reload()
    }
    const onOnline = () => {
      if (status === "error") reload()
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
  }, [calendars, status, fetchedAt])

  const selectCalendars = (next: CalendarSource[]) => {
    saveCalendars(next)
    setWeeks({})
    setError("")
    setCalendars(next)
  }

  const disconnect = () => {
    if (tokenRef.current) revokeAccessToken(tokenRef.current.accessToken)
    tokenRef.current = null
    saveCalendars([])
    setCalendars([])
    setWeeks({})
    setError("")
    setNeedsSignIn(false)
    setStatus("idle")
  }

  const reconnect = async () => {
    await ensureToken(true)
    setAttempt((count) => count + 1)
  }

  return {
    /** False when the app has no Google client ID, so Google Calendar can't be connected at all. */
    configured: GOOGLE_CLIENT_ID !== "",
    /** The calendars being shown; empty when Google Calendar isn't connected. */
    calendars,
    week,
    loading: status === "loading",
    error,
    needsSignIn,
    ensureToken,
    selectCalendars,
    disconnect,
    reconnect,
    reload: () => setAttempt((count) => count + 1),
  }
}
