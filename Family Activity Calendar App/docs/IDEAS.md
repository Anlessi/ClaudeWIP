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
- Electricity prices for other countries or price areas (needs another source; 0007).
