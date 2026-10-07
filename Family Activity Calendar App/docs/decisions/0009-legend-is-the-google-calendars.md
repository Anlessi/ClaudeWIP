# 0009: The legend lists Google calendars, not hard-coded family members

- **Status:** Accepted (2026-10-06)
- **Links:** Anlessi/ClaudeWIP#14, `src/events.ts`, `src/CalendarDialog.tsx`

## Context
The legend showed Mum, Dad, Mia, Leo and Family, but the owner's single shared Google calendar ("Family") only
ever produced Family events, which was confusing. Matching names in titles was a guess, and the names didn't fit
other families.

## Decision
- **Legend = the chosen Google calendars**, with Google's own names and colours. Event cards use their calendar's
  colour, with dark or light text for readability.
- **Several calendars** can be shown at once (a checkbox list in the dialog). A family with a calendar per person
  gets per-person colours automatically.
- The hard-coded people and title matching are removed. Before connecting, the sample events belong to one
  "Sample events" calendar, and the "Family member" field is gone from the manual form.
- Saved setting key `familyflow.googleCalendars`. The older single-calendar setting is migrated.

## Alternatives considered
- **A user-defined list of people:** more setup for everyone. The owner instead considered colouring by name on
  top of calendars ("detect and confirm"); it was built, then set aside as an idea (`../IDEAS.md`).
- **Manual events in a separate "app calendar":** rejected. Manual events should go to a chosen Google calendar,
  which needs write access (`../IDEAS.md`).

## Consequences
- With one shared calendar there are no per-person colours. Using one calendar per person works today, and
  colouring by name is parked in `../IDEAS.md`.
