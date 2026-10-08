# 0022: Calendar names and colours are refreshed from Google on every load

- **Status:** Accepted (2026-10-08)
- **Links:** this pull request, 0009, `src/googleCalendar.ts` (`refreshCalendars`), `src/useGoogleCalendar.ts`

## Context
The chosen calendars are saved in the browser with their name and colours (0009). The colours were only read from
Google when the calendar dialog was opened, so a colour changed in Google never reached the events in the app.

## Decision
- Each time events are loaded, the app also reads Google's calendar list and updates the saved name, colour and
  text colour of the chosen calendars (`refreshCalendars`).
- If something changed, the new values are saved and the events load again once with them.
- It is best effort: if the calendar list can't be read, the saved values are kept and events load as before.
  A calendar Google no longer lists keeps its saved values.

## Alternatives considered
- **Refresh only when the calendar dialog is opened:** the owner would still have to remember to open it.
- **Stop saving colours and read them at every start:** needs a sign-in before anything can be coloured, and the
  token is never saved (0008), so events would have no colours until then.

## Consequences
- One extra small request to Google per load (every 10 minutes while the app is visible).
- A changed colour shows after the next load or refresh, not instantly.
