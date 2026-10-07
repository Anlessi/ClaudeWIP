# 0015: Host the app on Vercel (free Hobby plan)

- **Status:** Accepted (2026-10-07)
- **Links:** this pull request, 0002, 0003, 0004, 0008; README "Hosting on Vercel"

## Context
The owner wanted to use the app on their phone without `localhost`. Installing the PWA and Google sign-in both
need an `https://` address (0004, 0008). The owner picked Vercel, because a later step will need small server
functions (staying signed in to Google), and Vercel can run those next to the static app.

## Decision
- The app is hosted on **Vercel's free Hobby plan**, built from GitHub. Every merge into `main` deploys to the
  production address. Other branches get preview addresses that only the Vercel account can open.
- Everything is set in the **Vercel dashboard**, with no `vercel.json`: Root Directory `Family Activity Calendar App`,
  Vite preset, install and build with `npx pnpm@10.34.3`, output `dist`, Node 22.x. `VITE_ACCESS_PIN` and
  `VITE_GOOGLE_CLIENT_ID` are set as environment variables there. The table is in the README.
- No code changes for this step. Sign-in, the PIN and the Google app (still in Testing) stay as they are.
- The site address is **not written in the repository**, because the repository is public. It is in the Vercel
  dashboard.

## Alternatives considered
- **Netlify or Cloudflare Pages:** similar, but the owner chose Vercel.
- **GitHub Pages:** static only, so no server functions later.
- **Tailscale or a Cloudflare quick tunnel** (0004): needs the computer running, so it's no good for everyday phone use.
- **A `vercel.json` with the settings and security headers:** not needed yet. Revisit when the `/api` functions
  arrive (`../IDEAS.md`).

## Consequences
- The site is public. The PIN can be read from the JavaScript (0003), so it is only a barrier. Calendar events
  still need a Google sign-in by a test user.
- Google sign-in works only after the Vercel address is added to the OAuth client's Authorized JavaScript origins.
  On 2026-10-07 this was not done yet. Preview addresses can't sign in.
- Changing a `VITE_*` variable needs a redeploy, because the values are built into the app.
- Hobby is for non-commercial use. Asking for donations is allowed, but selling access would need the Pro plan.
