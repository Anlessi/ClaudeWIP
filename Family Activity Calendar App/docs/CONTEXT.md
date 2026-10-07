# Context: Week at a Glance (Family Activity Calendar App)

_Last updated: 2026-10-07, after Anlessi/ClaudeWIP#14 (plus the docs pull request that added this file)._

A briefing for a new session: what exists, how it's built and what's next. Details and reasons are in the
decision records (`decisions/README.md`, loaded automatically) and setup in `../README.md`.

## What it is
A family week calendar for phones and tablets (also works on desktop) that shows the family's events next to
hourly weather and electricity prices. The owner designed it in Figma and uses it at home. Formerly "Family Flow",
renamed "Week at a Glance" (0010).

## What's built (on `main`)
- Week and Day views that follow the real date, with weeks running Monday to Sunday (0006)
- Hourly weather from Open-Meteo for a searched place (0005)
- Hourly Finnish electricity spot prices including VAT, from sahkotin.fi (0007)
- Real events from one or more Google calendars, read-only. The legend lists the calendars in their Google
  colours (0008, 0009). Before connecting, sample events can be added, edited and deleted in memory.
- A 6-digit PIN screen as a testing barrier (0003)
- An installable, offline-capable PWA, with the WG logo as its icon (0004, 0010)

## How it's built
- React 19, TypeScript, Vite 8, Tailwind CSS v4, from a Figma Make export (0001). Node 22, pnpm 10.34.3 via
  `npx pnpm@10.34.3 ...`. Formatter: oxfmt.
- **No server.** The browser calls the services directly (0002). Each source has a module, a `use*` hook, a
  saved copy in `localStorage` and a status line under the calendar with credit, errors and "Try again".

  | Source | Module | Hook | Saved key |
  |---|---|---|---|
  | Open-Meteo (weather, place search) | `weather.ts` | `useForecast.ts` | `familyflow.location`, `familyflow.forecast` |
  | sahkotin.fi (prices) | `electricity.ts` | `usePrices.ts` | `familyflow.prices` |
  | Google Calendar | `googleCalendar.ts`, `googleAuth.ts` | `useGoogleCalendar.ts` | `familyflow.googleCalendars` |

- `App.tsx` is the main UI (large, with sample data). Dialogs: `CalendarDialog.tsx`, `LocationDialog.tsx`.
  Others: `dates.ts` (week and window helpers), `useToday.ts`, `events.ts` (event types and overlap layout),
  `Icon.tsx`, `PinLock.tsx`, `index.css` (all styles, including phone and tablet layouts).
- **Settings** go in `.env.local` (not committed): `VITE_ACCESS_PIN`, `VITE_GOOGLE_CLIENT_ID`. See `.env.example`.
- **Tests:** Node's built-in test runner (`npx pnpm@10.34.3 run test`), files `src/*.test.ts`. Logic is tested,
  and the UI is checked in the browser preview. Don't add test dependencies without asking. Also run
  `npx tsc --noEmit` and `vite build` before a pull request.
- **Running:** the `family-calendar` configuration in `.claude/launch.json` (dev server, port 8443), or
  `family-calendar-installable` (production preview with service worker, port 4173). Google sign-in only works
  at `http://localhost:8443`, not at the `192.168.x.x` address (0008).

## Conventions in this app
- Plain-language UI text. Status and errors go in the line under the calendar.
- Data window: Monday of this week to Sunday of next week, one request per source (0006).
- Keep the `familyflow.*` storage keys. When a saved format changes, migrate the old one (as in 0009).
- When Google is connected, the app is read-only: no add or edit.

## In progress
- **Colour events by name** (branch `feat/name-colours`, not merged yet). It uses "detect and confirm": the app
  suggests the first word of event titles (up to a space, dash or colon) that starts at least two events, and the
  owner ticks which are people. Ticked names get one of eight colours, which wins over the calendar colour, and
  appear in the legend after a divider. "Milo - Football" shows as "Football". Saved in the browser only. The
  owner was checking it at localhost:8443 and hadn't seen the dialog section yet (it needs a live Google sign-in
  and names that repeat). Its decision record (0011) should be written by `/wrap-up` on that branch.

## Next steps (owner's choice; details in `IDEAS.md`)
1. Finish and merge name colours.
2. Nearby events (concept done, waiting on the owner's answers).
3. HTTPS hosting for phone use and installing. Stay signed in to Google. Add events to Google.
