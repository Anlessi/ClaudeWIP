# CLAUDE.md

Instructions for Claude Code when working in this repository.

## Project

- Repository: https://github.com/Anlessi/ClaudeWIP (remote `origin`, default branch `main`)
- Owner: Anlessi. Explain Git and GitHub steps in plain language; the owner is new to Git.
- Platform: Windows 11. Git is configured with `core.autocrlf=true`.

## Git workflow

- **Never commit directly to `main`.** Start every change on a new branch from an up-to-date `main`
  (run these one at a time; Windows PowerShell 5.1 does not support `&&`):
  `git switch main`, `git pull`, `git switch -c <type>/<short-description>`
- Branch names: `feat/...`, `fix/...`, `docs/...`, `chore/...`, `refactor/...`, `test/...` (lowercase, hyphenated).
- Keep each branch focused on one change. Unrelated changes go on separate branches.
- When the change is ready, push the branch (`git push -u origin <branch>`) and open a pull request into `main`.
  The GitHub CLI (`gh`) is not installed; until it is, give the owner the compare link
  `https://github.com/Anlessi/ClaudeWIP/compare/main...<branch>?expand=1` to open the PR.
- Review the full diff (`git diff main...<branch>`) before merging, and fix problems on the branch first.
- Merge only after the owner approves. Prefer squash merges, then delete the branch locally and on GitHub.
  Without `gh`, squash-merge locally (`git switch main`, `git pull`, `git merge --squash <branch>`,
  commit with a Conventional Commit message, `git push`), then delete the branch with
  `git branch -D <branch>` and `git push origin --delete <branch>`.
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
