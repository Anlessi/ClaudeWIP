# 0005: Hourly weather from Open-Meteo for a place the user searches for

- **Status:** Accepted (2026-10-06)
- **Links:** Anlessi/ClaudeWIP#6, #10, `src/weather.ts`, `src/LocationDialog.tsx`

## Context
The design shows hourly weather. The owner asked for real hourly temperature and sunny/cloudy/rain data from
Open-Meteo, based on a location setting.

## Decision
- **Open-Meteo** (free, no key, CORS allowed) for the forecast and the place search. Show the required credit
  under the calendar.
- The location is chosen by **searching for a city or town**. The choice (name and coordinates, rounded to about
  1 km) is saved only in the browser. The dialog opens by itself on first use.
- Hours 07:00–21:00 show temperature and a category derived from the WMO weather code and cloud cover, with a
  moon on clear hours after dark. Each day shows high, low and a short summary.
- The "Use my current location" option was built and then **removed** at the owner's request (#10): searching is
  enough, and the device location needs HTTPS and a permission prompt.

## Alternatives considered
- **Device geolocation:** removed (see above).

## Consequences
- The searched name and rounded coordinates are sent to Open-Meteo.
- Heavy rain and rain chance (in the original design) aren't shown yet, although the API provides them.
