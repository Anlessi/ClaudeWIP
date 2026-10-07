# CLAUDE.md

Instructions for Claude Code when working in this repository.

## Project

- Repository: https://github.com/Anlessi/ClaudeWIP (remote `origin`, default branch `main`)
- Owner: Anlessi. Explain Git and GitHub steps in plain language; the owner is new to Git.
- Platform: Windows 11. Git is configured with `core.autocrlf=true`.

## Projects

| Folder | What it is | Start here |
|---|---|---|
| `Family Activity Calendar App/` | "Week at a Glance", a family calendar web app (React, Vite, PWA) | `docs/CONTEXT.md` in that folder |

## Decisions and context

The repository keeps its own memory, so a new session does not need earlier decisions repeated. It has three layers:

- **This file:** the rules for working here.
- **`<project>/docs/CONTEXT.md`:** a one-page briefing per project covering what it is, how it's built, what's done,
  what's in progress and what's next. It is imported by the project's `CLAUDE.md`, so it loads automatically.
  Keep it under ~150 lines and keep it current, not historical.
- **`docs/decisions/` and `<project>/docs/decisions/`:** one short file per real decision (`NNNN-short-title.md`),
  explaining why and which alternatives were rejected. Each folder's `README.md` is the index and is loaded
  automatically. Open a record when a task touches its area. Repo-wide decisions (workflow, tooling) go in the
  top-level `docs/decisions/`, and project decisions go in that project's folder.
- **`docs/IDEAS.md` and `<project>/docs/IDEAS.md`:** ideas we discussed but have not built, so they aren't lost.

Rules:

- **Respect recorded decisions.** Don't silently go against an accepted decision. If a task conflicts with one,
  say so and ask. If the owner changes their mind, write a new record and mark the old one
  `Superseded by NNNN` (never delete records).
- **Write a decision record** for anything we would otherwise have to explain again, or where a reasonable
  alternative was turned down. Small implementation choices don't need one.
- **Commit the records on the same branch as the code**, so they are reviewed and merged together.
- **Before every pull request, run the `wrap-up` skill** (`/wrap-up`). It records new decisions, updates
  `CONTEXT.md` and `IDEAS.md`, and writes the pull request description with a `## Decisions` section.
  A hook (`.claude/hooks/require-wrap-up.js`) blocks `gh pr create` when the description file has no
  `## Decisions` section.
- Claude's private memory (outside the repository) holds only the owner's personal working preferences, not
  project facts. Project facts belong in these files.

Repository-wide decisions: @docs/decisions/README.md

## Git workflow

- **Never commit directly to `main`.** Start every change on a new branch from an up-to-date `main`
  (run these one at a time; Windows PowerShell 5.1 does not support `&&`):
  `git switch main`, `git pull`, `git switch -c <type>/<short-description>`
- Branch names: `feat/...`, `fix/...`, `docs/...`, `chore/...`, `refactor/...`, `test/...` (lowercase, hyphenated).
- Keep each branch focused on one change. Unrelated changes go on separate branches.
- Do not stack pull requests (a pull request whose base is another open pull request's branch). Merging the
  base with `--delete-branch` makes GitHub close the dependent pull request, and squash merges leave the
  branch history conflicting with `main`. If a change depends on one that is still open, ask the owner to
  approve and merge the first one, then branch from the updated `main`. If it happens anyway, start a fresh
  branch from `main` and `git cherry-pick` the commits, then open a new pull request.
- When the change is ready, run the `wrap-up` skill (see "Decisions and context"), then push the branch (`git push -u origin <branch>`) and open a pull request into `main`
  with the GitHub CLI: `gh pr create --base main --title "<conventional commit summary>" --body-file <file>`.
  Write the description (what and why) to a file in the scratchpad directory first: Windows PowerShell 5.1
  mangles double quotes inside `--body` text passed to native programs.
  The GitHub CLI is signed in as Anlessi. If `gh` is not on PATH, call it in PowerShell as `& "C:\Program Files\GitHub CLI\gh.exe"`.
- Review the full diff (`gh pr diff <number>`) before merging, and fix problems on the branch first.
- Merge only after the owner approves: `gh pr merge <number> --squash --delete-branch`, then
  `git switch main` and `git pull` to update the local copy.
- Never force-push to `main`, rewrite published history, or use `--no-verify`, unless the owner explicitly asks.

## Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <summary>`,
  e.g. `feat: add login form`, `fix: handle empty input`, `docs: update README`.
- Summary line: imperative mood, lowercase after the type, no trailing period, at most ~72 characters.
  Add a body explaining *why* when the change is not obvious.
- Make small, logical commits that each leave the project working.
- Review `git status` and `git diff --staged` before committing. Stage files by name rather than `git add .`
  so nothing unintended is included.
- Ask the owner before committing or pushing unless they have asked for it in the current request.

## Security

- Never commit secrets: passwords, API keys, tokens, `.env` files or private keys. Keep them in `.env`
  (ignored by `.gitignore`) and commit a `.env.example` with placeholder values instead.
- If a secret is committed by mistake, stop and tell the owner; the secret must be rotated, not just deleted.
- Do not commit large binaries or generated output (`node_modules/`, `dist/`, `build/`, virtual environments).

## Code quality

- Each project lives in its own top-level folder with its own README explaining what it is and how to run it.
- Match the existing style of the surrounding code. Use the project's formatter and linter when one exists.
- Add or update tests for behavior changes, and run tests before committing.
- Keep the README and this file current when setup steps or conventions change.
