# Family Flow – Family Activity Calendar

A family activity calendar for phones and tablets, showing each family member's events alongside hourly
weather and electricity prices. The UI was designed and exported from Figma Make.

The calendar follows the real date. The weather is real (see below); events and electricity prices are still
built-in sample data (the sample events are placed in the current week when the app opens), and event changes
are kept in memory and reset when the page reloads.

## Features

- Week and Day views that follow the real date: the arrows move by a week (week view) or a day (day view), and
  Today jumps back to the current date. Today is marked automatically, also after midnight
- Real hourly weather (temperature and sunny/cloudy/rain/snow) for a location you choose, from Open-Meteo
- Weather and Electricity toggles to show or hide hourly weather and prices
- Add, edit and delete events (name, day, family member, start time, duration, notes)
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
- `npx pnpm@10.34.3 run test` – run the tests for the weather logic
- `npx pnpm@10.34.3 run preview` – serve the production build (run `build` first), including the
  installable/offline version

## Project structure

- `src/App.tsx` – the calendar UI and sample data
- `src/dates.ts` – calendar date helpers (today, weeks, the forecast window; tested in `src/dates.test.ts`)
- `src/useToday.ts` – keeps today's date up to date while the app is open
- `src/weather.ts` – weather and place lookups from Open-Meteo, and turning them into calendar data (tested in `src/weather.test.ts`)
- `src/useForecast.ts` – loads the forecast and keeps it fresh
- `src/LocationDialog.tsx` – the dialog for choosing the weather location
- `src/Icon.tsx` – the icons
- `src/PinLock.tsx` – the PIN screen shown before the calendar
- `src/index.css` – styles, including the phone and tablet layouts
- `src/imports/` – the original Figma design image
- `public/icon.svg`, `pwa-assets.config.ts` – source icon and settings for the generated app icons
- `vite.config.ts`, `.figma/` – build configuration from Figma Make, plus the PWA settings

## Installing as an app (PWA)

Family Flow is a Progressive Web App: it can be added to a phone's or tablet's home screen, opens full
screen like a normal app, and keeps working without a connection once it has been opened once.

- **Service worker and offline use** only work in a production build (`build` then `preview`), not in the
  `dev` server, so that editing code is never confused by cached files.
- **Installing requires HTTPS.** Browsers only offer to install an app (and only run its service worker) on
  `https://` addresses or on `localhost`. A home-network address such as `http://192.168.x.x:8443` can show the
  app but cannot install it. To install it on a phone, the built app (`dist/`) has to be hosted at an
  `https://` address.
- **Installing:** on Android (Chrome) use the browser menu and choose "Install app" or "Add to Home screen". On
  iPhone/iPad (Safari) use Share, then "Add to Home Screen".
- **Updates:** the app updates itself in the background; the new version is used the next time it is opened.
- The app icons are generated from `public/icon.svg` at build time.

## Weather and location

The hourly weather comes from [Open-Meteo](https://open-meteo.com/), which needs no account or API key and is
free for non-commercial use; the app shows the required credit under the calendar.

- **Choosing a location:** the first time the app opens it asks for one. Search for a city or town; the button
  showing the place name at the top changes it later.
- **What is sent where:** the place you search for and the approximate coordinates of the chosen place
  (rounded to about 1 km) are sent to Open-Meteo. The choice itself is saved only in this browser
  (`localStorage`); it is never part of the repository.
- **What is shown:** temperature and a sunny/cloudy/rain/snow category for each hour from 07:00 to 21:00, plus a
  daily high, low and short summary such as "Rain from 17:00". Clear hours after dark show a moon. The time
  column shows the time zone of the chosen place.
- **Updates and offline:** the forecast reloads when the app is opened after 30 minutes or more, and when the
  connection returns after a failure. The last forecast is kept in the browser, so if the service can't be
  reached the app shows that saved copy with a note and a "Try again" button.
- **Dates:** one request covers the current week (Monday to Sunday) and the next week, counted from today's
  date on the device, so it never goes more than 13 days ahead (Open-Meteo allows 15). Days outside that
  window (older weeks, or more than a week ahead) show no weather, and the line under the calendar says so.
