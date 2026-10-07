# Ideas: Week at a Glance

Discussed but not built. When one is picked up, it moves to a pull request (and a decision record if needed) and
is removed here.

## Nearby events (concept done, 2026-10-06)
A "Nearby" toggle next to Weather and Electricity, showing events in the chosen city for this week and next.
Researched and called live:
- **Big events: Ticketmaster Discovery API.** Free key (5,000 calls a day), CORS allowed. Search by
  `latlong` + `radius=25km`, `classificationName=music,sports`. Finnish coverage is partial, because many shows
  sell through Lippupiste or Tiketti, which have no public API.
- **Local events: Linked Events.** `api.hel.fi/linkedevents/v1` (Helsinki) and `api.espoo.fi/events/v1` (Espoo),
  no key needed, CORS allowed. Search with `dwithin_origin` + `dwithin_metres=15000` and filter by keyword
  (concerts, sports, family), because Helsinki has about 3,300 events in two weeks. Tampere, Turku and Oulu had
  no usable free source.
- Rejected: TheSportsDB (free key too limited), Eventbrite, Songkick, Meetup, PredictHQ (closed or paid).
- **Proposed look:** a separate "Nearby" row of chips under "All day" (at most about 3 a day plus "+N more"),
  in a dashed grey style. Merge same-title, same-day duplicates. Same refresh and offline pattern as prices.
- **Waiting on the owner:** (1) which city they use (Helsinki region or not), (2) OK to create a free
  Ticketmaster key, (3) chips row or cards in the grid, (4) toggle on or off by default.

## HTTPS hosting, for phones and installing
Needed to install the PWA and to sign in to Google on a phone (0004, 0008). Options: Tailscale (private),
a Cloudflare quick tunnel (temporary), or a host such as Netlify or Cloudflare Pages (public, so the PIN matters
more). GitHub Pages is public even from a private repository. Add the `https://` address to the Google
"Authorized JavaScript origins", and set `VITE_GOOGLE_CLIENT_ID` in the host's build.

## Stay signed in to Google
Today the sign-in lasts about an hour. A wall tablet would want no tapping, which needs a small server to keep a
refresh token safe (changes 0002 and 0008).

## Add events to Google Calendar
Add event would write to a chosen Google calendar. It needs the broader `calendar.events` scope and replaces
the in-memory sample events while connected.

## Real access control
Replace the PIN (0003) with real sign-in. It needs a server.

## Smaller items
- Heavy rain and rain chance from the original design (Open-Meteo provides both).
- Electricity prices for other countries or price areas (needs another source; 0007).
