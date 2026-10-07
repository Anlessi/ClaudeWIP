# Decisions: Week at a Glance (Family Activity Calendar App)

One file per decision. Open a record when a task touches its area. The format is in
`.claude/skills/wrap-up/decision-template.md` at the repository root.

| # | Decision | Status |
|---|---|---|
| [0001](0001-build-from-the-figma-export.md) | Build from the Figma Make export, only what the design shows | Accepted |
| [0002](0002-no-server-browser-calls-apis-directly.md) | No server: the browser calls public services directly (CORS, no secret keys) | Accepted |
| [0003](0003-pin-lock-is-a-testing-barrier.md) | A 6-digit PIN screen as a basic barrier while testing, not real security | Accepted |
| [0004](0004-installable-pwa-tested-on-home-network.md) | An installable, offline-capable PWA, tested on the home network for now | Accepted; hosting superseded by 0015 |
| [0005](0005-weather-from-open-meteo-for-a-searched-place.md) | Hourly weather from Open-Meteo for a searched place (no device location) | Accepted |
| [0006](0006-follow-the-real-date-two-week-window.md) | Follow the real date, with a data window of this week and next week | Accepted |
| [0007](0007-electricity-prices-from-sahkotin.md) | Finnish spot prices including VAT from sahkotin.fi | Accepted |
| [0008](0008-google-calendar-read-only-in-the-browser.md) | Read-only Google Calendar, browser sign-in, token in memory only | Accepted |
| [0009](0009-legend-is-the-google-calendars.md) | The legend lists Google calendars, not hard-coded family members | Accepted |
| [0010](0010-name-week-at-a-glance.md) | The app is called "Week at a Glance" (internal names unchanged) | Accepted |
| [0011](0011-no-adding-or-editing-events-in-the-app.md) | No adding or editing events in the app; it only shows Google events (and read-only samples) | Accepted |
| [0012](0012-dark-theme-follows-the-device.md) | Dark theme follows the device setting; the install icon is dark | Accepted |
| [0013](0013-aurora-from-noaa-kp-forecast.md) | Northern lights from NOAA's 3-day Kp forecast, shown in dark, clear hours as Low/Mid/High | Accepted |
| [0014](0014-theme-switch-button.md) | A light/dark switch button in the top bar; follows the device until used | Accepted |
| [0015](0015-host-on-vercel.md) | Hosted on Vercel's free Hobby plan, set up in the dashboard; address kept out of the public repository | Accepted |
