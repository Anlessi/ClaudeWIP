# 0011: No adding or editing events in the app

- **Status:** Accepted (2026-10-07)
- **Links:** this pull request, 0008, `src/App.tsx`

## Context
Before Google Calendar was connected, the app let you add, edit and delete in-memory sample events. The owner
decided the app will only use the read-only Google calendar, so events are managed in Google Calendar itself.

## Decision
- Removed the "Add event" button, the event dialog and the edit and delete handling.
- Event cards are plain, non-clickable cards (hover for details).
- The sample events stay, read-only, so the app still shows something before Google is connected.

## Alternatives considered
- **Remove the sample events too:** they are useful as a demo before connecting, so they stay.
- **Keep editing for the sample events only:** pointless once real events can't be edited.

## Consequences
- The app is read-only everywhere, which matches 0008.
- "Add events to Google Calendar" in `IDEAS.md` would need to bring a form back, with a broader Google permission.
