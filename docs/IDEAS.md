# Ideas (repository-wide)

Discussed but not decided or built. Move an item into a decision record or a pull request when it's picked up,
and remove it here.

## Rename the GitHub repository to FamilyFlow
- **Discussed:** 2026-10-06 (Google Calendar session). No decision yet.
- `ClaudeWIP` appears only in `CLAUDE.md` and `README.md`. GitHub redirects the old address, so links keep working.
- Steps: `gh repo rename <name>`, `git remote set-url origin <new address>`, then a `docs/` pull request.
- **Don't rename the local folder** `D:\Claude Projects\ClaudeWIP`. Claude's memory and session list are keyed
  to that path, and `.claude/launch.json` uses paths relative to it.
- Since then the app was renamed "Week at a Glance", so the new name should be chosen with that in mind.
