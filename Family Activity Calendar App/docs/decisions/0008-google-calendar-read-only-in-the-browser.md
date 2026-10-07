# 0008: Read-only Google Calendar access, signed in from the browser

- **Status:** Accepted (2026-10-06)
- **Links:** Anlessi/ClaudeWIP#12, `src/googleAuth.ts`, `src/googleCalendar.ts`, README "Google Calendar"

## Context
The owner wanted the real family Google Calendar instead of the sample events. There is no server (0002).

## Decision
- Sign in with **Google Identity Services** in the browser, asking only for read-only scopes
  (`calendar.calendarlist.readonly`, `calendar.events.readonly`).
- The access token is kept **in memory only** and lasts about an hour. The line under the calendar asks to
  "Sign in" after opening the app and an hour later. Only the chosen calendars' ids, names and colours are saved
  in the browser.
- While connected, Add event and editing are turned off (read-only).
- The OAuth client ID is public but kept in `.env.local` as `VITE_GOOGLE_CLIENT_ID`. The Google Cloud app stays
  in **Testing** mode, with family accounts added as test users.
- Only a 401 asks to sign in again. Any other error names the calendar that failed.

## Alternatives considered
- **Staying signed in:** needs a small server to keep a refresh token safe. Deferred (`../IDEAS.md`).
- **Write access** (adding events to Google): a broader permission, deferred (`../IDEAS.md`).

## Consequences
- Google accepts only `http://localhost` or `https://` origins. Opening the app as `http://192.168.0.13:8443`
  gives `400 origin_mismatch`. Connecting works on the computer at `http://localhost:8443`, and phones need
  HTTPS hosting.
- The original "who is it for" matching of Mum/Dad/Mia/Leo in titles was replaced by 0009.
