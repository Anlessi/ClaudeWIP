# 0030: An About dialog with support and privacy text

- **Status:** Accepted (2026-10-09)
- **Links:** this pull request; 0008, 0016, 0017, 0021; `src/AboutDialog.tsx`

## Context
The first-release plan (`IDEAS.md`, step 4) asks for a support link and, for Google's app verification, a
privacy description. The owner asked for an About button in the top bar that opens a dialog explaining what
the app is, how to support the developer, and how data is handled.

## Decision
- An **About** button with an "i in a box" icon (`info` in `Icon.tsx`) sits at the far right of the top bar,
  right of the light/dark button, with the same look (`theme-toggle` class).
- It opens `AboutDialog.tsx`, built like `EventDialog.tsx` (closes with ✕, Close, Escape or a click outside).
  Three sections: **About** (what the app does; Google Calendar only, read-only), **How to support the
  developer** (buy the owner's *Develop with AI* PDF guide on Ko-fi) and **Your data and privacy** (no server,
  read-only Google access with a token kept only while the page is open, what is saved in the browser, which
  outside services are called and that they can see the IP address, cookie-free Vercel statistics, no ads).
- The Ko-fi link is **placeholder text** ("Ko-fi link coming soon"), not a link, until the owner's Ko-fi page exists.
- On phones the location button is narrower (`max-width` 7rem instead of 9.5rem) so the top bar still fits at 360px.

## Alternatives considered
- **A live link to `ko-fi.com` as a placeholder:** rejected by the owner; no link until the real page exists.
- **A separate privacy page:** not needed yet; the dialog text covers it. Google verification may still need a
  page with its own address (see `IDEAS.md`).

## Consequences
- The privacy text must stay true. Update it when data handling changes, for example when "stay signed in"
  (IDEAS step 2) changes how the Google sign-in is kept, or when a new outside service is added.
- Selling a guide is a sale, not a donation: the owner should check tax and Vercel Hobby's non-commercial rule
  before launch (`IDEAS.md`, step 4).
- "Set location" is cut short on phones before a place is chosen; short place names still fit.
