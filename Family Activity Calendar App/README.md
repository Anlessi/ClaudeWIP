# Week at a Glance – Family Activity Calendar

A family activity calendar for phones and tablets, showing the family's events alongside hourly
weather and electricity prices. The UI was designed and exported from Figma Make.

The calendar follows the real date. The weather and the electricity prices are real (see below). Events are real
once you connect your Google Calendar (see below); until then they are built-in sample data (placed in the
current week when the app opens), and changes to them are kept in memory and reset when the page reloads.

## Features

- Week and Day views that follow the real date: the arrows move by a week (week view) or a day (day view), and
  Today jumps back to the current date. Today is marked automatically, also after midnight
- Real hourly weather (temperature and sunny/cloudy/rain/snow) for a location you choose, from Open-Meteo
- Real hourly electricity prices in c/kWh including VAT, for the days the Nord Pool market has published
- Northern lights forecast for the next 3 days (Low/Mid/High in dark, clear hours), from NOAA
- Weather, Electricity and Northern lights toggles to show or hide each layer
- Real events from one or more Google calendars (read-only), each in its Google colour, with a legend of the
  calendars; all-day events and overlapping events are shown
- Layouts for phones, tablets and desktops

## Running locally

Requires [Node.js](https://nodejs.org/) 22 or newer. Dependencies are managed with pnpm (version in `.mise.toml`).

From this folder:

```bash
npx pnpm@10.34.3 install
npx pnpm@10.34.3 run dev
```

The app asks for a 6-digit PIN before showing the calendar. Copy `.env.example` to `.env.local` and set
`VITE_ACCESS_PIN` to your PIN; `.env.local` is not committed. Restart the dev server after changing it.
This PIN is only a basic barrier for testing: it is included in the app's JavaScript, so it does not
protect against a determined person.

Then open http://localhost:8443. The dev server also listens on your local network, so you can open
`http://<your-computer's-IP>:8443` on a phone or tablet on the same Wi-Fi.

Other commands:

- `npx pnpm@10.34.3 run build` – production build into `dist/`
- `npx tsc --noEmit` – type-check
- `npx pnpm@10.34.3 run test` – run the tests for the calendar logic (weather, prices, events)
- `npx pnpm@10.34.3 run preview` – serve the production build (run `build` first), including the
  installable/offline version

## Project structure

- `src/App.tsx` – the calendar UI and sample data
- `src/events.ts` – event and calendar types, and laying out overlapping events (tested in `src/events.test.ts`)
- `src/googleCalendar.ts` – reads events from Google Calendar and turns them into calendar events (tested in `src/googleCalendar.test.ts`)
- `src/googleAuth.ts` – signing in to Google (read-only access)
- `src/useGoogleCalendar.ts` – keeps the chosen calendar's events for the week on screen up to date
- `src/CalendarDialog.tsx` – the dialog for connecting Google Calendar and choosing the calendar
- `src/dates.ts` – calendar date helpers (today, weeks, the forecast window; tested in `src/dates.test.ts`)
- `src/useToday.ts` – keeps today's date up to date while the app is open
- `src/weather.ts` – weather and place lookups from Open-Meteo, and turning them into calendar data (tested in `src/weather.test.ts`)
- `src/electricity.ts` – electricity price lookups from sahkotin.fi and turning them into hourly prices (tested in `src/electricity.test.ts`)
- `src/usePrices.ts` – loads the prices and keeps them fresh
- `src/aurora.ts` – northern lights Kp forecast from NOAA, the Kp needed at a place and which hours to mark (tested in `src/aurora.test.ts`)
- `src/useAurora.ts` – loads the Kp forecast and keeps it fresh
- `src/useForecast.ts` – loads the forecast and keeps it fresh
- `src/LocationDialog.tsx` – the dialog for choosing the weather location
- `src/Icon.tsx` – the icons
- `src/PinLock.tsx` – the PIN screen shown before the calendar
- `src/index.css` – styles, including the phone and tablet layouts
- `src/imports/` – the original Figma design image
- `public/icon.svg`, `pwa-assets.config.ts` – source icon and settings for the generated app icons
- `vite.config.ts`, `.figma/` – build configuration from Figma Make, plus the PWA settings

## Installing as an app (PWA)

Week at a Glance is a Progressive Web App: it can be added to a phone's or tablet's home screen, opens full
screen like a normal app, and keeps working without a connection once it has been opened once.

- **Service worker and offline use** only work in a production build (`build` then `preview`), not in the
  `dev` server, so that editing code is never confused by cached files.
- **Installing requires HTTPS.** Browsers only offer to install an app (and only run its service worker) on
  `https://` addresses or on `localhost`. A home-network address such as `http://192.168.x.x:8443` can show the
  app but cannot install it. On a phone, open the hosted version instead (see "Hosting on Vercel").
- **Installing:** on Android (Chrome) use the browser menu and choose "Install app" or "Add to Home screen". On
  iPhone/iPad (Safari) use Share, then "Add to Home Screen".
- **Updates:** the app updates itself in the background; the new version is used the next time it is opened.
- The app icons are generated from `public/icon.svg` at build time.

## Hosting on Vercel

The app is hosted on [Vercel](https://vercel.com/) (free Hobby plan), which builds it from GitHub and serves it at
an `https://…vercel.app` address. The address is in the Vercel dashboard; it is deliberately not written in this
public repository. Every merge into `main` updates the site automatically. Other branches get a "preview" address
that only the Vercel account owner can open.

The project is set up in the Vercel dashboard (there is no `vercel.json`):

| Setting | Value |
|---|---|
| Root Directory | `Family Activity Calendar App` |
| Framework Preset | Vite |
| Install Command | `npx pnpm@10.34.3 install --frozen-lockfile` |
| Build Command | `npx pnpm@10.34.3 run build` |
| Output Directory | `dist` |
| Node.js Version | 22.x |
| Environment Variables | `VITE_ACCESS_PIN`, `VITE_GOOGLE_CLIENT_ID` (same as `.env.local`) |

- **Changing a setting:** after changing an environment variable, redeploy (Deployments → ⋯ → Redeploy), because
  `VITE_*` values are built into the app.
- **Google sign-in** works only after the site's `https://` address is added to the OAuth client's **Authorized
  JavaScript origins** (see "Google Calendar" below). Preview addresses change per branch, so they can't sign in.
- **Web Analytics** (visitor and page-view counts) must be switched on once in the project's **Analytics** tab
  → **Enable**. The app already loads the script (`inject()` in `src/main.tsx`); until it is enabled, the
  script's request returns a harmless 404. The dev server only logs page views to the console.
- **The site is public.** Anyone with the address sees the PIN screen, and the PIN can be read from the app's
  JavaScript. Calendar events only appear after a Google sign-in with one of the app's test users.
- Search engines are told not to list the site (`robots` in `.figma/make/site.json`).

## Weather and location

The hourly weather comes from [Open-Meteo](https://open-meteo.com/), which needs no account or API key and is
free for non-commercial use; the app shows the required credit under the calendar.

- **Choosing a location:** the first time the app opens it asks for one. Search for a city or town; the button
  showing the place name at the top changes it later.
- **What is sent where:** the place you search for and the approximate coordinates of the chosen place
  (rounded to about 1 km) are sent to Open-Meteo. The choice itself is saved only in this browser
  (`localStorage`); it is never part of the repository.
- **What is shown:** temperature and a sunny/cloudy/rain/snow category for each hour from 07:00 to 24:00, plus a
  daily high, low and short summary such as "Rain from 17:00". Clear hours after dark show a moon. The time
  column shows the time zone of the chosen place.
- **Updates and offline:** the forecast reloads when the app is opened after 30 minutes or more, and when the
  connection returns after a failure. The last forecast is kept in the browser, so if the service can't be
  reached the app shows that saved copy with a note and a "Try again" button.
- **Dates:** one request covers the current week (Monday to Sunday) and the next week, counted from today's
  date on the device, so it never goes more than 13 days ahead (Open-Meteo allows 15). Days outside that
  window (older weeks, or more than a week ahead) show no weather, and the line under the calendar says so.

## Electricity prices

The prices are Finnish day-ahead spot prices from the Nord Pool market, read from [sahkotin.fi](https://sahkotin.fi/)
(an independent Finnish service; Nord Pool owns the price data). The calendar's own electricity prices are not an
offer from any supplier, only the market price.

- **Why not Nord Pool directly:** its official data API is a paid service, and the free public price services
  (Nord Pool's own site, Elering, porssisahko.net) do not allow requests from a web page. sahkotin.fi does.
- **What is shown:** the price for each hour in cents per kWh *including* Finnish VAT (currently 25.5 %, added by
  the service). Each hourly price is the average of Nord Pool's four 15-minute prices in that hour. Prices of 10
  cents and above are shown without a decimal. Negative prices are possible (and are shown), with VAT applied to
  them in the same way. Hours at or below 3 c/kWh are marked low (green arrow down), at or above 15 high (red
  arrow up); the limits are `LOW_PRICE` and `HIGH_PRICE` in `src/electricity.ts`.
- **Which days:** only days Nord Pool has published prices for have any: earlier days of the current week, today
  and, from early afternoon, tomorrow. Other days stay empty, and the line under the calendar says so.
- **Updates and offline:** the app looks again every 30 minutes while it is open and when it is opened again after
  30 minutes or more. The last prices are kept in the browser, so if the service can't be reached the app shows
  that saved copy with a note and a "Try again" button.
- **Assumption:** prices are always for Finland, whatever place is chosen for the weather. Other countries or
  price areas would need another source.

## Northern lights

The forecast is the planetary Kp index (geomagnetic activity, 0–9) from NOAA's
[Space Weather Prediction Center](https://www.swpc.noaa.gov/), which needs no account or key.

- **What is shown:** for about the next 3 days, an hour gets a chip when Kp reaches the level needed at the
  chosen place, it is dark there and cloud cover is at most 60 % (from the weather forecast). The chip shows the
  aurora level: Kp 0–2 "Low", 3–4 "Mid", 5–9 "High" (exact Kp on hover). Days with such hours get an aurora icon,
  and if the lights are possible later today a banner appears at the top.
- **Kp needed:** worked out from the place's geomagnetic latitude, about Kp 1 in Lapland and 4 in Helsinki
  (`kpNeeded` in `src/aurora.ts`). The line under the calendar shows the value for the chosen place.
- **Limits:** only the hours the calendar shows (until 24:00). Cloudy hours are hidden. No phone notifications.
- **Updates and offline:** the app looks again every 3 hours while open and keeps the last forecast in the
  browser, like the prices.

## Google Calendar

The app can show the real events of a Google Calendar instead of the sample events. It only **reads** the
calendar: it can't add, change or delete anything, and the app has no way to add or edit events
(change them in Google Calendar itself). There is no server: the browser talks to Google
directly.

### One-time setup (about 10 minutes)

Google needs to know which app is asking for access, so you create a free "OAuth client" once:

1. Go to the [Google Cloud console](https://console.cloud.google.com/), create a project (for example
   "Week at a Glance") and open **APIs & Services**.
2. **Library**: search for **Google Calendar API** and click **Enable**.
3. **OAuth consent screen** (also called Google Auth Platform): choose **External**, fill in the app name and your
   email, and under **Audience**/**Test users** add the Google account(s) that own or can see the family
   calendar. Leave the app in **Testing** mode: that is fine for family use. (Google then shows an "unverified
   app" warning when you sign in; choose to continue.)
4. **Data access / Scopes**: add `.../auth/calendar.calendarlist.readonly` and `.../auth/calendar.events.readonly`.
5. **Credentials** → **Create credentials** → **OAuth client ID** → type **Web application**. Under **Authorized
   JavaScript origins** add every address the app is opened from, for example `http://localhost:8443` and, for
   your phone or tablet, the Vercel `https://` address (without a `/` at the end). (Plain `http://192.168.x.x`
   addresses are not accepted by Google.) A new origin can take from a few minutes to a few hours to work.
6. Copy the **Client ID** (it ends in `.apps.googleusercontent.com`) into `.env.local` as
   `VITE_GOOGLE_CLIENT_ID=...` and restart the dev server. The client ID is not a secret, but keep it out of
   the repository like the other settings. Set the same variable in Vercel (see "Hosting on Vercel").

### Using it

- Press **Connect calendar** (or the link under the calendar), sign in, and tick the calendars to show. You can
  change the choice later from the same button.
- **The legend is the list of calendars:** each calendar keeps the name and colour it has in Google Calendar, and
  its events use that colour. A family with one shared calendar sees one legend entry; a family with a calendar
  for each person (Mum, Dad, Mia, Leo…) sees them all, so the calendars are the family members. The sample
  events, shown before anything is connected, belong to one made-up "Sample events" calendar.
- **If you connected before this change:** the calendar you chose then is found again, but in a neutral colour
  until you open **Change calendars** and choose it again, which also fetches its Google colour.
- **What is shown:** timed events in the hours 07:00–24:00 on the device's clock (events that cross midnight are
  split over both days), all-day and multi-day events in an "All day" row, and overlapping events side by side.
  Events completely outside 07:00–24:00 are counted in a note under the calendar but not drawn. Cancelled events
  and events you have declined are left out. The location and description show as the event's note.
- **Signing in again:** Google's sign-in lasts about an hour and is deliberately never saved in the browser. When
  you open the app, and again after an hour, the line under the calendar asks you to **Sign in**; one tap
  renews it (Google only shows a short window, because the app is already allowed). Only the name of the chosen
  calendar is remembered in this browser. Staying signed in without tapping would need a small server to keep
  a long-lived key safe, which this app doesn't have.
- **Updates:** the week on screen reloads when the app comes back into view after 5 minutes, every 10 minutes
  while it is open, and when the connection returns after a failure.
- **Disconnecting:** open the calendar button and choose **Disconnect**: the sign-in is revoked and the app goes
  back to the sample events. You can also remove the app's access in your [Google account settings](https://myaccount.google.com/permissions).
