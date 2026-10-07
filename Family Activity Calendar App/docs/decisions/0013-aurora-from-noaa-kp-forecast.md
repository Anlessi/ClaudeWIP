# 0013: Northern lights from NOAA's Kp forecast, filtered by place, darkness and clouds

- **Status:** Accepted (2026-10-07)
- **Links:** this pull request, 0002, 0005, `src/aurora.ts`, `src/useAurora.ts`

## Context
The owner wanted a northern lights (aurora) alert in the calendar from a free, open source without a key, with a
toggle like Electricity, ideally for a week but 1-3 days was fine. Whether the lights can be seen depends on
geomagnetic activity, how far north the place is, darkness and clouds.

## Decision
- **Source:** NOAA Space Weather Prediction Center's planetary Kp forecast
  (`services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json`). Free, no key, CORS allowed (0002).
  It gives Kp (0-9) in 3-hour UTC slots. Only the forecast part is used ("estimated" today and "predicted"
  ahead), so about **3 days**. The owner chose 3 days only.
- **Kp needed at the place:** from its geomagnetic latitude (dipole formula), `round((66 − magnetic latitude) / 2)`,
  at least 1. About Kp 1 in Lapland, 2 in Oulu, 3 in Jyväskylä, 4 in Helsinki and Kaarina. Above 9 means "almost
  never" and nothing is shown.
- **An hour is marked** only when Kp is at least the needed value, Open-Meteo says it is dark (`is_day = 0`) and
  cloud cover is at most 60 % (`MAX_AURORA_CLOUD`). The owner chose to **hide cloudy hours**, not show them faded.
- **Display:** a chip in the hour cell with the **aurora level** in words: Kp 0-2 "Low", 3-4 "Mid", 5-9 "High"
  (Kp rounded first; exact Kp on hover). The owner chose "Mid" over "Moderate" to save space. The legend reads
  "Aurora level" followed by only the levels on screen. Days with marked hours get an aurora icon in the heading.
- **Alert:** a banner at the top when hours later today are marked. In-app only, no phone notifications.
- **Toggle:** "Northern lights", on by default. The status line gives credit to NOAA and the Kp needed here.

## Alternatives considered
- **Finnish Meteorological Institute's aurora service:** real-time magnetometer readings only, no forecast.
- **NOAA 27-day outlook** (daily max Kp, would cover a week): very rough; the owner chose 3 days only.
- **NOAA OVATION aurora map:** a 30-90 minute nowcast, too short for a calendar.
- **Showing cloudy hours faded:** turned down by the owner.
- **Push notifications:** need HTTPS hosting and a server (see IDEAS.md).

## Consequences
- The calendar shows 07:00-24:00, so lights after midnight are not shown.
- Kp is in the device's time zone and weather in the place's; they match for places in Finland.
- The Kp-needed rule is a rule of thumb; tune the constant in `kpNeeded` if it proves too strict or too loose.
- `HourWeather` now keeps `cloud`. Forecasts saved by older versions have none, so no markers until the fresh
  forecast loads.
- Saved copy: `familyflow.aurora`. Refreshes every 3 hours while open.
