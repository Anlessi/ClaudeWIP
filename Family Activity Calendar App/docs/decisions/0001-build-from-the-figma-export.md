# 0001: Build the app from the Figma Make export, only what the design shows

- **Status:** Accepted (2026-10-06)
- **Links:** Anlessi/ClaudeWIP#2

## Context
The owner designed the UI in Figma and exported it with Figma Make into this folder (React, Vite, Tailwind CSS v4).
They asked for the basic functionality the design shows, with default values, "don't add anything else".

## Decision
- Keep the Figma Make project as the base: its structure, `AGENTS.md`, `.figma/` and build setup.
  `CLAUDE.md` imports `AGENTS.md` and adds a note that locally no dev server runs by default.
- Features are added one pull request at a time, only when the owner asks, and replace sample data with real
  data step by step.

## Alternatives considered
- **Rebuilding from scratch** in another stack: loses the exact design and the Figma Make workflow.

## Consequences
- `AGENTS.md` describes the Figma Make environment ("a dev server is already running"), which isn't true locally.
- The package name `figma-make-app` comes from the export, and nothing depends on it.
