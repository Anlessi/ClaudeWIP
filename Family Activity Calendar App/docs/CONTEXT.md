# Context: Week at a Glance (Family Activity Calendar App)

_Last updated: 2026-10-08, after the pull request that moves the location button to the top bar._

A briefing for a new session: what exists, how it's built and what's next. Details and reasons are in the
decision records (`decisions/README.md`, loaded automatically) and setup in `../README.md`.

## What it is
A family week calendar for phones and tablets (also works on desktop) that shows the family's events next to
hourly weather and electricity prices. The owner designed it in Figma and uses it at home. Formerly "Family Flow",
renamed "Week at a Glance" (0010).

## What's built (on `main`)
- Week and Day views that follow the real date, with weeks running Monday to Sunday (0006).
  Today has a dark heading, and in the Week view a 2px frame in the same colour (`--ink`) around the whole
  column, drawn as an overlay (`::after`) so it takes no room. The Day view has no frame.
- The top bar holds the logo and title, Day/Week, a **location** button (pin + place name) and the theme button
  (0021). On phones the title text is hidden and the switch is smaller, so the row fits at 360px.
- A compact header on every screen size (0020): the date stays on one line next to ‹ Today › and a **Filters**
  button, which opens a panel with the layer toggles and the calendar button. The legend is a "Legend"
  line that expands. Both start closed on every load. On phones a week across two months shows short months
  ("28 Sep – 4 Oct 2026") so the date never wraps.
- The day grid runs 07:00–24:00 (`START_HOUR` and `END_HOUR` in `App.tsx`); weather, prices and Google events follow it
- Hourly weather from Open-Meteo for a searched place (0005). Each hour cell shows a 20px icon and the
  temperature at 0.8rem in the main text colour (`--ink`), so it stands out; the day headings keep a 15px icon
- Hourly Finnish electricity spot prices including VAT, from sahkotin.fi (0007)
- Northern lights for the next 3 days from NOAA's Kp forecast (0013): a Low/Mid/High chip in dark hours with
  at most 60 % cloud when Kp reaches the level needed at the place, an icon in the day heading, an "Aurora level"
  legend and a "tonight" banner at the top. "Northern lights" toggle, on by default
- Real events from one or more Google calendars, read-only. The legend lists the calendars in their Google
  colours (0008, 0009). Before connecting, read-only sample events are shown. There is no add, edit or delete (0011). A green notice at the top
  of the page says so and links to "Connect Google Calendar". When calendars are saved but Google needs a new sign-in (the token is never
  saved, so after every reload), a notice at the top asks to sign in, with a button.
- Overlapping events show as one card: the earliest event, a "+N" chip, covering the whole group's time (0019).
  Every card opens a read-only details window (`EventDialog.tsx`) listing the group's events.
  Cards have 4px corners, a 1px edge in a darker shade of the calendar colour (`--event-edge-tint`) and a small
  shadow. The edge is an inset shadow, so it takes no room and doesn't affect `cardLayout`.
- Event titles wrap over up to 4 rows, but only the whole rows that fit above the time (`cardLayout` in
  `events.ts`, which mirrors the card sizes in `index.css`; keep them in step). The price legend reads "< 3" and "15<" (`LOW_PRICE`, `HIGH_PRICE`)
- A dark theme that follows the device setting until the sun/moon button in the top bar is used (0012, 0014), the design system contrast fixes and the transparent WG logo (0012)
- A 6-digit PIN screen as a testing barrier (0003)
- An installable, offline-capable PWA, with a dark WG icon (0004, 0010, 0012)
- Hosted on Vercel's free Hobby plan (0015): every merge into `main` deploys. The settings are in the Vercel
  dashboard (table in the README), and the address is there too, kept out of this public repository. The Vercel
  address is not yet in Google's Authorized JavaScript origins, so Google sign-in on the hosted site doesn't
  work until the owner adds it.
- Vercel Web Analytics counts visits, with no cookies (0016). The owner switches it on in the dashboard
  (Analytics → Enable); until then nothing is counted.
- Vercel Speed Insights measures load speed for real visitors, also with no cookies (0017). The owner switches
  it on in the dashboard (Speed Insights → Enable); until then nothing is collected.

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

- `App.tsx` is the main UI (large, with sample data). Dialogs: `CalendarDialog.tsx`, `LocationDialog.tsx`,
  `EventDialog.tsx`. Others: `dates.ts` (week and window helpers), `useToday.ts`, `events.ts` (event types,
  overlap groups, card text layout, `formatTime`),
  `Icon.tsx`, `PinLock.tsx`, `index.css` (all styles, including phone and tablet layouts).
- Images are ordinary Git files, not Git LFS, because Vercel does not fetch LFS files (0018).
- **Settings** go in `.env.local` (not committed): `VITE_ACCESS_PIN`, `VITE_GOOGLE_CLIENT_ID`. See `.env.example`.
  The same variables are set in Vercel, and changing one there needs a redeploy.
- **Tests:** Node's built-in test runner (`npx pnpm@10.34.3 run test`), files `src/*.test.ts`. Logic is tested,
  and the UI is checked in the browser preview. Don't add test dependencies without asking. Also run
  `npx tsc --noEmit` and `vite build` before a pull request. Don't run oxfmt over `App.tsx` or `Icon.tsx`
  as they are: on 2026-10-08 it added blank lines and broke `App.tsx` (these files aren't oxfmt-formatted).
- **Running:** the `family-calendar` configuration in `.claude/launch.json` (dev server, port 8443), or
  `family-calendar-installable` (production preview with service worker, port 4173). Google sign-in works at
  `http://localhost:8443` (and on the Vercel address once it is added to Google), not at `192.168.x.x` (0008).
  On a phone, use the Vercel address.

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
The owner's goal for the **first release** (updated 2026-10-07) is a public app: people sign in with their own
Google account and stay signed in, there is no PIN, it is free with an optional donation link, and usage is
monitored. Hosting is done (0015). The proposed order (details in `IDEAS.md`):
1. Add the Vercel address to Google's Authorized JavaScript origins (owner).
2. Stay signed in to Google with small Vercel functions and an encrypted cookie, and remove the PIN.
3. Publish and verify the Google app (start early).
4. A donation link (replaces the Stripe idea).
5. Usage monitoring: Web Analytics (0016) and Speed Insights (0017) are done; error reports and uptime checks remain.
6. Final polish of the look and feel.

Open questions: custom domain or not, which donation platform, and whether paid access is dropped for good.

**Set for a later version:** nearby events and electricity prices for other countries or price areas. They are
kept in `IDEAS.md`. The owner dropped the northern lights follow-ups (phone notification, days 4-7).
