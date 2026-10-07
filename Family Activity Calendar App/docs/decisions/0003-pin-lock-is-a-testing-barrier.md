# 0003: A 6-digit PIN screen as a basic barrier while testing

- **Status:** Accepted (2026-10-06)
- **Links:** Anlessi/ClaudeWIP#4, `src/PinLock.tsx`

## Context
The owner wanted to keep personal information a bit safer during testing ("we can think of the proper security
later").

## Decision
- A 6-digit PIN screen (`PinLock.tsx`) wraps the app. It submits automatically after 6 digits and stays unlocked
  until the page is reloaded.
- The PIN is read from `VITE_ACCESS_PIN` in `.env.local` and is never committed (not even in docs). If no valid
  PIN is set, the app stays locked and explains how to set one.

## Alternatives considered
- **Real access control:** needs a server (see 0002), so it's deferred.

## Consequences
- The PIN is built into the app's JavaScript, so a technical person can find or bypass it. It must not be
  treated as security, especially if the app is ever hosted publicly.
