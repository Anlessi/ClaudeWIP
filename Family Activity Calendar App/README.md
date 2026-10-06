# Family Flow – Family Activity Calendar

A family activity calendar for phones and tablets, showing each family member's events alongside hourly
weather and electricity prices. The UI was designed and exported from Figma Make.

This first version only implements what the design shows, using built-in sample data for the week of
5–11 October 2026. Changes are kept in memory and reset when the page reloads.

## Features

- Week and Day views, with previous day, Today and next day navigation
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

Then open http://localhost:8443. The dev server also listens on your local network, so you can open
`http://<your-computer's-IP>:8443` on a phone or tablet on the same Wi-Fi.

Other commands:

- `npx pnpm@10.34.3 run build` – production build into `dist/`
- `npx tsc --noEmit` – type-check
- `npx pnpm@10.34.3 run preview` – serve the production build, including the installable/offline version

## Project structure

- `src/App.tsx` – the calendar UI and sample data
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
