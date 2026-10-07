# Context: Week at a Glance (Family Activity Calendar App)

_Last updated: 2026-10-07, after the pull request that added the light/dark switch button._

A briefing for a new session: what exists, how it's built and what's next. Details and reasons are in the
decision records (`decisions/README.md`, loaded automatically) and setup in `../README.md`.

## What it is
A family week calendar for phones and tablets (also works on desktop) that shows the family's events next to
hourly weather and electricity prices. The owner designed it in Figma and uses it at home. Formerly "Family Flow",
renamed "Week at a Glance" (0010).

## What's built (on `main`)
- Week and Day views that follow the real date, with weeks running Monday to Sunday (0006)
- The day grid runs 07:00–24:00 (`START_HOUR` and `END_HOUR` in `App.tsx`); weather, prices and Google events follow it
- Hourly weather from Open-Meteo for a searched place (0005)
- Hourly Finnish electricity spot prices including VAT, from sahkotin.fi (0007)
- Northern lights for the next 3 days from NOAA's Kp forecast (0013): a Low/Mid/High chip in dark hours with
  at most 60 % cloud when Kp reaches the level needed at the place, an icon in the day heading, an "Aurora level"
  legend and a "tonight" banner at the top. "Northern lights" toggle, on by default
- Real events from one or more Google calendars, read-only. The legend lists the calendars in their Google
  colours (0008, 0009). Before connecting, read-only sample events are shown. There is no add, edit or delete (0011). A green notice at the top
  of the page says so and links to "Connect Google Calendar". When calendars are saved but Google needs a new sign-in (the token is never
  saved, so after every reload), a notice at the top asks to sign in, with a button.
- Event titles wrap over up to 4 rows inside the card. The price legend reads "< 3" and "15<" (`LOW_PRICE`, `HIGH_PRICE`)
- A dark theme that follows the device setting until the sun/moon button in the top bar is used (0012, 0014), the design system contrast fixes and the transparent WG logo (0012)
- A 6-digit PIN screen as a testing barrier (0003)
- An installable, offline-capable PWA, with a dark WG icon (0004, 0010, 0012)

## How it's built
- React 19, TypeScript, Vite 8, Tailwind CSS v4, from a Figma Make export (0001). Node 22, pnpm 10.34.3 via
  `npx pnpm@10.34.3 ...`. Formatter: oxfmt.
- **No server.** The browser calls the services directly (0002). Each source has a module, a `use*` hook, a
  saved copy in `localStorage` and a status line under the calendar with credit, errors and "Try again".

  | Source | Module | Hook | Saved key |
  |---|---|---|---|
  | Open-Meteo (weather, place search) | `weather.ts` | `useForecast.ts` | `familyflow.location`, `familyflow.forecast` |
  | sahkotin.fi (prices) | `electricity.ts` | `usePrices.ts` | `familyflow.prices` |
  | NOAA SWPC (aurora Kp) | `aurora.ts` | `useAurora.ts` | `familyflow.aurora` |
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
- The app is read-only: no add or edit of events anywhere (0011).
- Colours are CSS variables with a light and a dark value in `index.css`, dark under `:root[data-theme="dark"]` (0012, 0014). Do not write colours directly in rules.

## In progress
Nothing.

## Not wanted
The owner decided these will not be done: colouring events by a name in the title, adding events to Google
Calendar (see 0011), scrolling to the current hour, heavy rain and rain chance in the weather, and a backup source
for electricity prices.

## Next steps (owner's choice; details in `IDEAS.md`)
The owner's scope for the **first release** (2026-10-07), in this order. The first four depend on each other and
are best planned together:
1. HTTPS hosting for phone use and installing.
2. Real access control (replaces the PIN).
3. A payment method (Stripe).
4. Stay signed in to Google.
5. Final polish of the look and feel.

**Set for a later version:** nearby events and electricity prices for other countries or price areas. They are
kept in `IDEAS.md`. The owner dropped the northern lights follow-ups (phone notification, days 4-7).
