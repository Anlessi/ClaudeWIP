# 0010: The app is called "Week at a Glance", with the WG logo

- **Status:** Accepted (2026-10-06)
- **Links:** Anlessi/ClaudeWIP#13

## Context
New branding from the owner: a WG logo and a new name in place of "Family Flow". The header also repeated the
name in two places.

## Decision
- Display name **"Week at a Glance"** in the UI, page title, install manifest and README. The WG logo goes in the
  top bar, the PIN screen and the app icon (white background).
- The duplicate "Family calendar" / "Week at a glance" texts under the top bar are removed. The week heading is
  the date range (for example "5–11 October 2026").
- **Not renamed:** the folder `Family Activity Calendar App`, the saved-settings keys `familyflow.*` (renaming
  would make the browser forget the saved location and calendars), and the package name `figma-make-app`.

## Alternatives considered
- **Renaming everything:** more risk (launch configuration paths, lost saved settings) for no visible gain.

## Consequences
- The Google Cloud project and OAuth consent screen names are set in the Google console, not in code. The owner
  renames them there if wanted.
- Phones that installed the app earlier keep the old icon and name until it's reinstalled.
