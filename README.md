# ClaudeWIP

Work-in-progress projects built with Claude Code.

| Project | Description |
|---|---|
| [Family Activity Calendar App](Family%20Activity%20Calendar%20App/) | "Week at a Glance", a family week calendar with weather, electricity prices and Google Calendar |

## How decisions are kept

Each project has a `docs/` folder with a current-state briefing (`CONTEXT.md`), a decision log (`decisions/`)
and parked ideas (`IDEAS.md`). Repository-wide decisions are in [`docs/decisions/`](docs/decisions/). Claude Code
reads these at the start of a session and updates them with the `/wrap-up` skill before every pull request.
See `CLAUDE.md` for the rules.
