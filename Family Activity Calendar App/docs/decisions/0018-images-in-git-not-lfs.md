# 0018: Store images as ordinary Git files, not Git LFS

- **Status:** Accepted (2026-10-08)
- **Links:** this pull request, 0001, 0015; `../../.gitattributes`

## Context
The Figma Make export (0001) came with a `.gitattributes` that put all images (and many other file types) in
Git LFS. With LFS the repository holds only a small text "pointer" and the real file is stored separately.
Vercel (0015) does not download LFS files by default, so the hosted app got the pointer text instead of the
WG logo, and the logo was missing in the top bar. Locally it looked fine, because the real files were on disk.

## Decision
- Images are stored as ordinary Git files. `.gitattributes` now only marks image and font types as `binary`,
  so Git does not change their line endings or show text diffs.
- The three PNGs (both logos and the Figma design screenshot, about 650 KB together) were re-added as real files.

## Alternatives considered
- **Turn on Git LFS in the Vercel dashboard (Settings → Git):** works, but it is one more setting to remember on
  any host, and each build would use GitHub's free LFS download allowance. The files are too small to need LFS.

## Consequences
- Don't add the LFS rules back. If a really large file is ever needed, discuss it first; LFS would then also
  need to be switched on in Vercel.
- Old commits still contain the LFS pointers. That only matters when checking out history.
