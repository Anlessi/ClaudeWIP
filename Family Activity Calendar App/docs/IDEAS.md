# Ideas: Week at a Glance

Discussed but not built. When one is picked up, it moves to a pull request (and a decision record if needed) and
is removed here.

## First release (the owner's scope, updated 2026-10-07)
Hosting is done (0015). The owner then asked for a plan for a public release (2026-10-07): other people sign in
with their own Google account and stay signed in, the PIN goes if it isn't needed (the owner prefers removing it),
the app stays free with an optional donation, and there is usage monitoring after release. The plan below was
proposed in that session and is not built yet. Order:
1. Add the Vercel address to Google's Authorized JavaScript origins (owner, a dashboard step; 0015)
2. Stay signed in to Google, and remove the PIN
3. Publish and verify the Google app (start early: Google's review can take days to weeks)
4. Donation link (replaces the earlier Stripe idea)
5. Usage monitoring
6. Final polish of the look and feel

**Open questions for the owner:** (1) a custom domain (about €10–15 a year, recommended for Google
verification) or the free `*.vercel.app` address, (2) which donation platform (Ko-fi, Buy Me a Coffee or GitHub
Sponsors), (3) whether Stripe and paid access are dropped for good. Paid access would need Vercel Pro.

### 2. Stay signed in to Google, and remove the PIN
- **Why the PIN can go:** the app holds no data of its own. Weather, prices and aurora are public. Calendar events
  are read with each person's own Google sign-in, and settings are saved only in their browser. "Sign in with
  Google" becomes the only sign-in. Visitors who aren't signed in see the sample week. Replaces 0003.
- **Proposed design:** four small Vercel functions. `/api/auth/login` sends the person to Google with offline
  access, PKCE and `state`. `/api/auth/callback` stores the refresh token **encrypted in an `HttpOnly; Secure;
  SameSite=Lax` cookie**, so there is no database. `/api/auth/token` returns a fresh 1-hour access token.
  `/api/auth/logout` revokes access and clears the cookie. The browser keeps calling Google Calendar itself, so
  `googleCalendar.ts` barely changes, and `useGoogleCalendar.ts` gets its token from `/api/auth/token`.
  Changes 0002 (a small server, for sign-in only) and replaces 0008.
- **Security:** the client secret and the cookie key are Vercel variables, never `VITE_*`. Tokens are never logged.
  Add a rate limit on `/api/auth/token` and security headers (CSP, frame blocking) in a `vercel.json`.
- **PWA catch:** the service worker sends every page request to `index.html`. Add
  `navigateFallbackDenylist: [/^\/api\//]` in `vite.config.ts`, or the OAuth callback is broken.
- **Watch out:** in Testing mode Google refresh tokens expire after 7 days, so this only works fully after item 3.
  Test the sign-in from an installed iPhone PWA (the riskiest case). New dependencies (for example the OAuth
  library Arctic) need the owner's OK.

### 3. Publish and verify the Google app
Mostly the owner's admin work. The calendar read-only scopes are "sensitive": verification is needed, but not the
paid security audit (that is only for "restricted" scopes). Needed: domain ownership proved in Google Search
Console, a home page, a **privacy policy** and terms (static pages in the app), and a short demo video of the
sign-in. Until it is verified, there is a 100-user cap and an "unverified app" warning.

### 4. Donation link (replaces Stripe, 2026-10-07)
A "Support the developer" link in a small About dialog, with the data credits and the privacy policy link. No
server and no Stripe code. Vercel Hobby allows donations ("does not fall under commercial usage"). **Check
before launch (Finland):** the Money Collection Act (*rahankeräyslaki*) may apply when a private person asks the
public for money, and donations may be taxable. Check the Police's and Vero's guidance.
Also before going public: Open-Meteo's free use covers sites "that do not have subscriptions or advertising".
Donations aren't mentioned, so email info@open-meteo.com. The limit is under 10,000 calls a day, counted per user
because browsers call it. Ask sahkotin.fi about their terms too.

### 5. Usage monitoring
No personal data and no tracking cookies, so no consent banner: Vercel Web Analytics and Speed Insights
(included in Hobby), Sentry for errors (free tier, with tokens removed from reports), UptimeRobot or Better Stack
checking `/` and an `/api/health` endpoint, and the Google Cloud Console API dashboard. Don't use the Google
Analytics option in `.figma/make/site.json`: in the EU it needs a cookie banner.

### 6. Final polish of the look and feel (added 2026-10-07)
Minor UI changes to give the app a finished look. The details aren't decided yet: collect the specific items
with the owner first (for example spacing, fonts, colours, dialogs, phone layout), then do them as one or a few
small pull requests.

## Set for later version
Not in the first release (owner's decision, 2026-10-07).

### Nearby events (concept done, 2026-10-06)
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

### Electricity prices for other countries or price areas
Needs another source (0007).
