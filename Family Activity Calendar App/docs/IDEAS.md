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

## Colour events by name (built, then set aside, 2026-10-07)
With one shared Google calendar every event has the calendar's colour, so nothing says who an event is for. The
idea: use the name an event title starts with ("Milo - Football", "Tanja yoga"). It was built and checked in the
browser (58 tests passed), then the owner cancelled it before any pull request, to analyse the idea later. The
code was never merged and no copy is kept in the repository. The design that was settled:
- **Detect and confirm, not automatic.** The owner chose this to avoid false matches. A name is the first word of
  the title, up to a space, dash or colon, ignoring capital letters. A word is only suggested when it starts at
  least two events (so "milo:" and "Milo" count together). The app lists suggestions with counts, and the owner
  ticks which are people. Unticked words, such as "Dentist", are ignored.
- **Where:** a "Colour events by name" section of chips in the calendar dialog, using the titles of every week
  loaded so far. Ticking takes effect at once, with no save button.
- **Look:** each ticked name gets the next of eight fixed dark colours (white text). A name's colour wins over the
  calendar colour. The legend adds the names after a divider, only while their events are on screen. The name is
  dropped from the card title only when a dash or colon follows it ("Milo - Football" shows "Football").
- **Saved** in the browser only, under `familyflow.people` (name, colour). Events carried an optional `colorId` so
  cards could look up the name's colour instead of the calendar's.
- **Limits found:** it is hidden until the owner opens the dialog with a live Google sign-in, so it is easy to miss.
  Suggestions only come from weeks already viewed. First words that aren't names can be suggested.
- **Questions to settle before building it again:** is the colour-per-name idea still wanted, or would one Google
  calendar per person (already supported, 0009) be simpler? Should suggestions appear on the main screen instead
  of inside the dialog? Should the colour be editable?

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
