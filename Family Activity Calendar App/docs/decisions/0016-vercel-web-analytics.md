# 0016: Count visits with Vercel Web Analytics

- **Status:** Accepted (2026-10-08)
- **Links:** this pull request, 0002, 0015; `src/main.tsx`; `../IDEAS.md` "Usage monitoring"

## Context
The first release should have usage monitoring (`../IDEAS.md`). The owner asked to set up Vercel Analytics
for the hosted app. The site is public and used in the EU, so the tool must not need a cookie banner.

## Decision
- Use **Vercel Web Analytics** (included in the Hobby plan) through the `@vercel/analytics` package, by calling
  `inject()` once in `src/main.tsx` before the app renders. Visits on the PIN screen are counted too.
- It uses no cookies and stores no personal data, so no consent banner is needed.
- It is switched on in the Vercel dashboard (project → Analytics → Enable), like the other settings (0015).
- In the dev server it runs in debug mode: page views are logged to the console and nothing is sent.

## Alternatives considered
- **Google Analytics** (the option in `.figma/make/site.json`): needs a cookie banner in the EU.
- **The `<Analytics />` React component:** the same result. `inject()` is enough because the app has no routes.
- **Speed Insights and Sentry** at the same time: not asked for now; still listed in `../IDEAS.md`.

## Consequences
- Until Web Analytics is enabled in the dashboard, the script request returns 404 and nothing is counted.
- Ad blockers can block the script, so the counts are a lower limit.
- The script is not cached by the service worker, so offline visits are not counted.
- The Hobby plan has a monthly event limit; check the Analytics tab if traffic grows.
