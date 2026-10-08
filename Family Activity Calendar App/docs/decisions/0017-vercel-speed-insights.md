# 0017: Measure load speed with Vercel Speed Insights

- **Status:** Accepted (2026-10-08)
- **Links:** this pull request, 0015, 0016; `src/main.tsx`; `../IDEAS.md` "Usage monitoring"

## Context
Usage monitoring is part of the first release (`../IDEAS.md`). Web Analytics already counts visits (0016). The
owner asked to set up Vercel Speed Insights for the hosted app as the next monitoring step.

## Decision
- Use **Vercel Speed Insights** (included in the Hobby plan) through the `@vercel/speed-insights` package, by
  calling `injectSpeedInsights()` once in `src/main.tsx`, next to the Web Analytics `inject()` call.
- It measures Core Web Vitals (how fast the page loads and responds) for real visitors, with no cookies, so no
  consent banner is needed.
- It is switched on in the Vercel dashboard (project → Speed Insights → Enable), like Web Analytics (0016).
- In the dev server it loads a debug script and sends nothing.

## Alternatives considered
- **The `<SpeedInsights />` React component:** the same result. The plain call matches how Web Analytics is
  added, and the app has no routes.
- **Lighthouse runs only:** test a single load on one machine, not what real visitors get on their phones.

## Consequences
- Until Speed Insights is enabled in the dashboard, nothing is collected.
- Ad blockers can block the script, and offline visits are not measured.
- The Hobby plan has a monthly data point limit; check the Speed Insights tab if traffic grows.
