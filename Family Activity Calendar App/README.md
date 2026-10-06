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

The app asks for a 6-digit PIN before showing the calendar. Copy `.env.example` to `.env.local` and set
`VITE_ACCESS_PIN` to your PIN; `.env.local` is not committed. Restart the dev server after changing it.
This PIN is only a basic barrier for testing: it is included in the app's JavaScript, so it does not
protect against a determined person.

Then open http://localhost:8443. The dev server also listens on your local network, so you can open
`http://<your-computer's-IP>:8443` on a phone or tablet on the same Wi-Fi.

Other commands:

- `npx pnpm@10.34.3 run build` – production build into `dist/`
- `npx tsc --noEmit` – type-check

## Project structure

- `src/App.tsx` – the calendar UI and sample data
- `src/PinLock.tsx` – the PIN screen shown before the calendar
- `src/index.css` – styles, including the phone and tablet layouts
- `src/imports/` – the original Figma design image
- `vite.config.ts`, `.figma/` – build configuration from Figma Make
