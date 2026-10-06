// Signing in to Google from the browser, with Google Identity Services. There is no server: Google hands
// the page a short-lived access token (about an hour) that can only read calendars. It is kept in memory
// only, never saved, so closing the app signs it out of Google until the next time it is opened.

/** The OAuth client ID is public (it is not a secret); it comes from .env.local. */
export const GOOGLE_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ""

// Read-only: the list of calendars and their events. Nothing can be changed or deleted.
const SCOPE = [
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
].join(" ")

const SCRIPT_URL = "https://accounts.google.com/gsi/client"

export type AccessToken = {
  accessToken: string
  /** When the token stops working, in milliseconds since 1970. */
  expiresAt: number
}

/** Why a sign-in didn't work: the user closed the window, a pop-up was blocked, access was refused… */
export class GoogleAuthError extends Error {
  readonly reason: string

  constructor(reason: string) {
    super(`Google sign-in failed (${reason}).`)
    this.reason = reason
  }
}

type TokenResponse = {
  access_token?: string
  expires_in?: number | string
  error?: string
}

type TokenClient = {
  requestAccessToken: () => void
}

type Oauth2 = {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
    error_callback: (error: { type?: string }) => void
  }) => TokenClient
  revoke: (accessToken: string, done?: () => void) => void
}

function oauth2(): Oauth2 | undefined {
  return (window as unknown as { google?: { accounts?: { oauth2?: Oauth2 } } })
    .google?.accounts?.oauth2
}

let scriptLoading: Promise<Oauth2> | null = null

/** Loads Google's sign-in script the first time it is needed. */
function loadGoogleScript(): Promise<Oauth2> {
  const loaded = oauth2()
  if (loaded) return Promise.resolve(loaded)
  if (scriptLoading) return scriptLoading

  scriptLoading = new Promise<Oauth2>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => {
      const ready = oauth2()
      if (ready) resolve(ready)
      else reject(new GoogleAuthError("script_unavailable"))
    }
    script.onerror = () => reject(new GoogleAuthError("script_blocked"))
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    scriptLoading = null
    throw error
  })
  return scriptLoading
}

/**
 * Asks Google for an access token. Google opens a small window for this (just to confirm, if the app
 * has been allowed before), and browsers only allow that window after a click, so call this from a
 * button press.
 */
export async function requestAccessToken(): Promise<AccessToken> {
  if (!GOOGLE_CLIENT_ID) throw new GoogleAuthError("not_configured")
  const google = await loadGoogleScript()

  return new Promise<AccessToken>((resolve, reject) => {
    const client = google.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new GoogleAuthError(response.error ?? "no_token"))
          return
        }
        const seconds = Number(response.expires_in) || 3600
        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + seconds * 1000,
        })
      },
      error_callback: (error) =>
        reject(new GoogleAuthError(error.type ?? "unknown")),
    })
    client.requestAccessToken()
  })
}

/** Tells Google to stop honouring the token (used when disconnecting). */
export function revokeAccessToken(accessToken: string) {
  oauth2()?.revoke(accessToken)
}
