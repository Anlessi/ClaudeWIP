# 0004: An installable, offline-capable PWA, tested on the home network for now

- **Status:** Accepted (2026-10-06). The "home network only" part is superseded by 0015 (2026-10-07): the app is now hosted on Vercel
- **Links:** Anlessi/ClaudeWIP#5, `vite.config.ts`, `pwa-assets.config.ts`

## Context
The app is meant for phones and tablets, so the owner wanted it installable as a PWA. They also asked how to test
it without releasing it publicly.

## Decision
- Use `vite-plugin-pwa` for the manifest and a service worker, with icons generated from `public/icon.svg`
  (white background, see 0010). It updates automatically: a new version is used the next time the app opens.
- Testing on the **home network** (`http://<computer-IP>:8443`) is enough for now. The app isn't hosted anywhere.

## Alternatives considered
- **GitHub Pages:** makes the app public, even from a private repository on a free account. Rejected for now.
- **Tailscale** (most private) or a **Cloudflare quick tunnel** (quickest) for HTTPS on a phone. They were offered
  but not needed yet.

## Consequences
- Installing and offline use need `https://` (or `localhost`), so a phone on `http://192.168.x.x` can open the
  app but can't install it.
- The service worker only runs in a production build (`build` + `preview`, the `family-calendar-installable`
  launch configuration), never in `dev`.
- A mistake to avoid: listing `webmanifest` in the cache patterns duplicated a file and silently disabled all
  caching.
