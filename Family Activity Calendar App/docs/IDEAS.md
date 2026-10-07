# Ideas: Week at a Glance

Discussed but not built. When one is picked up, it moves to a pull request (and a decision record if needed) and
is removed here.

## Final polish of the look and feel (added 2026-10-07)
Minor UI changes to give the app a finished look. The details aren't decided yet: collect the specific items
with the owner first (for example spacing, fonts, colours, dialogs, phone layout), then do them as one or a few
small pull requests.

## Northern lights (aurora) alert (added 2026-10-07)
Alert the family when northern lights may be visible. Not researched yet. Questions to answer first:
- **Data source**, which must be free and allow browser requests (0002). Candidates to check: the Finnish
  Meteorological Institute's aurora service and NOAA's space weather (Kp index) forecasts.
- **Visibility:** combine the aurora activity with the cloud cover we already get from Open-Meteo, and with
  darkness at the chosen place.
- **How to alert:** a marker in the calendar or a status line is possible today. A real phone notification
  needs push notifications, which needs HTTPS hosting and probably a server, so it's linked to the hosting idea
  below.

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
Linked: "Real access control" and "Payment method" both build on this (Stripe requires HTTPS). A host that can also
run a small server would serve all three.

## Stay signed in to Google
Today the sign-in lasts about an hour. A wall tablet would want no tapping, which needs a small server to keep a
refresh token safe (changes 0002 and 0008).

## Add events to Google Calendar
Add event would write to a chosen Google calendar. It needs the broader `calendar.events` scope and would need the
add and edit form that 0011 removed.

## Dark mode (added 2026-10-07)
A dark colour theme. The details aren't decided yet: whether it follows the device setting automatically, has
its own switch, or both. Notes for when it's picked up:
- A good start exists: the main colours are CSS variables in `:root` in `src/index.css` (`--ink`, `--surface`,
  `--canvas`, `--accent`, the weather tints and so on). A dark set of those values can go under
  `@media (prefers-color-scheme: dark)`.
- About 24 colours further down `index.css` are written directly instead of through variables. They need moving
  to variables first.
- Event cards use each Google calendar's own colour, with dark or light text picked for readability (0009). Check
  they still look right on a dark background.
- The install settings in `vite.config.ts` (`theme_color`, `background_color`) and the WG logo and icon (white
  background, 0010) are light. Decide whether they change too.
- Fits well with the "final polish" idea above.

## Payment method, for example Stripe (added 2026-10-07)
Let people pay for the app. Nothing is decided yet. What is being sold (a one-off purchase, a subscription, a
donation) and who pays (the family or other users) are not settled, so collect those answers first. Notes for
when it's picked up:
- **Needs a server in most cases.** Stripe's secret key must never be in the browser, which conflicts with 0002
  (no server). The exception is Stripe Payment Links or hosted Checkout created in the Stripe dashboard: they
  need no code on our side, but cannot tell the app who has paid.
- **Knowing who has paid** (to unlock features) needs accounts and a server to receive Stripe's webhooks, and
  Stripe requires HTTPS.
- **Linked ideas:** this is one of three that depend on each other: "HTTPS hosting, for phones and installing",
  "Real access control" and this one. Plan them together: hosting comes first (an HTTPS address and a place to
  run a small server), then real sign-in, then payment, which needs both. "Stay signed in to Google" would use
  the same server.
- **Questions to settle:** what is sold and at what price, who the customers are, which countries (VAT and
  business registration in Finland), and whether a simple payment link or a donation button is enough.

## Real access control
Replace the PIN (0003) with real sign-in. It needs a server.
Linked: it needs "HTTPS hosting" first, and "Payment method" needs it to know who has paid, so plan the three
together.

## Smaller items
- Heavy rain and rain chance from the original design (Open-Meteo provides both).
- Scroll to the current hour when the calendar opens. The grid now runs 07:00–24:00 and is taller, so on a phone
  the evening is a long scroll away (the page starts at 07:00).
- Electricity prices for other countries or price areas (needs another source; 0007).
- A backup source for electricity prices. On 2026-10-07 sahkotin.fi was stuck in a redirect loop (every URL, even
  the home page, redirected to itself with no CORS headers), so the app showed "Couldn't reach the electricity
  price service". Candidates: porssisahko.net, ENTSO-E (needs a key). Would change 0007.
