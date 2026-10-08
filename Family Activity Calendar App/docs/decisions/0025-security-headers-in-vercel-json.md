# 0025: Security headers in `vercel.json`

- **Status:** Accepted (2026-10-08)
- **Links:** this pull request, 0002, 0003, 0015 (its "no `vercel.json` yet" is updated here); `vercel.json`,
  `public/theme.js`, `vite.config.ts`

## Context
The app is live on Vercel (0015) with no security headers: no Content-Security-Policy (CSP), and other sites could
show it in a frame. The owner asked which security and privacy policies to add, and chose the five standard
headers now instead of waiting for the `/api` sign-in functions.

## Decision
- A `vercel.json` in the app folder sends five headers with every response:
  - **Content-Security-Policy:** only our own site plus the services the app calls: Open-Meteo
    (`api.` and `geocoding-api.open-meteo.com`), `sahkotin.fi`, `services.swpc.noaa.gov`,
    `www.googleapis.com`, and Google sign-in under `https://accounts.google.com/gsi/`. No inline scripts, no
    `eval`, `frame-ancestors 'none'`. Vercel Analytics and Speed Insights load from our own site (`/_vercel/...`),
    so they need no entry.
  - **X-Frame-Options: DENY** (frame blocking for older browsers).
  - **Referrer-Policy: strict-origin-when-cross-origin.**
  - **Permissions-Policy:** camera, microphone, location, payment and USB turned off.
  - **X-Content-Type-Options: nosniff.**
- The theme script that ran inline in `index.html` is now `public/theme.js`. It still runs before the first paint.
- `vite preview` reads the same headers from `vercel.json`, so the installable test version matches the live site.
  The `family-calendar-installable-google` launch setting runs it on port 8443, where Google sign-in works. The
  dev server has no headers, because it needs inline scripts.
- **Rule:** any new outside service (for example Sentry or Nearby events in `../IDEAS.md`) must be added to the CSP,
  or the browser blocks it. Test with the installable version and look for CSP errors in the console.

## Alternatives considered
- **Allow inline styles (`'unsafe-inline'`) for Google:** Google's sign-in script adds an inline `<style>` for its
  "Sign in with Google" button. The app doesn't use that button (it opens Google's popup), so the CSP blocks it.
  This shows one CSP message in the console when signing in and changes nothing on screen. Not worth weakening
  the policy.
- **A hash of the inline theme script in the CSP:** fragile, because any whitespace or line-ending change breaks
  it. A file is simpler.
- **HSTS (`Strict-Transport-Security`):** left out until there is a custom domain. Vercel already forces HTTPS.
- **A strict `Cross-Origin-Opener-Policy`:** would break the Google sign-in popup.

## Consequences
- The headers can't make the PIN secret (0003): the PIN is still in the JavaScript. Hiding it needs a check on
  Vercel's side (see `../IDEAS.md`).
- The CSP must be updated when the `/api` functions, Sentry or any new service arrive.
- Tested on 2026-10-08 with the installable version: weather, place search, prices, northern lights, theme,
  offline cache and Google sign-in with real calendars all worked. A request to an address not on the list was
  blocked.
