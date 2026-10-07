# 0002: No server: the browser calls public services directly

- **Status:** Accepted (2026-10-06)
- **Links:** 0005, 0007, 0008; Anlessi/ClaudeWIP#6, #11, #12

## Context
The app is a static web app (and a PWA) with no backend. Every real data source (weather, electricity prices,
Google Calendar) had to be reachable from the browser.

## Decision
- The app stays **static, with no server of its own**. Each data source is called directly from the browser.
- So a source must allow requests from a web page (CORS) and must not need a secret key. Public, non-secret
  keys (like the Google OAuth client ID) go in `.env.local` as `VITE_*` and are documented in `.env.example`.
- Each source follows the same pattern: one module that knows about it (`weather.ts`, `electricity.ts`,
  `googleCalendar.ts`), a hook that keeps the data fresh (`useForecast`, `usePrices`, `useGoogleCalendar`), a
  saved copy in `localStorage` that is shown with a note when the service fails, and a status line under the
  calendar with the credit, errors and a "Try again" button.

## Alternatives considered
- **A small server:** would allow paid or non-CORS APIs, long-lived Google sign-in and real access control, but
  needs hosting and maintenance. It's kept as a possible later step (`../IDEAS.md`).

## Consequences
- Sources without CORS are ruled out (Nord Pool, Elering, porssisahko.net; see 0007).
- Google sign-in lasts only about an hour (see 0008).
- The PIN is only a basic barrier (see 0003).
- Anything in a `VITE_*` variable is visible in the built JavaScript.
