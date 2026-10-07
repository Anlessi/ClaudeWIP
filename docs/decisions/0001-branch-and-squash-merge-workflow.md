# 0001: Every change goes through a branch and a squash-merged pull request

- **Status:** Accepted (2026-10-06)
- **Links:** `CLAUDE.md` "Git workflow", Anlessi/ClaudeWIP#1

## Context
The owner is new to Git and asked for industry best practice from the start. The first version had no GitHub CLI,
so pull requests were opened from a compare link and merged locally.

## Decision
- Never commit directly to `main`. Each change gets its own branch (`feat/`, `fix/`, `docs/`, ...) and a pull request.
- Use Conventional Commits for commit messages and pull request titles.
- Open, review and merge pull requests with the GitHub CLI (`gh`), signed in as Anlessi.
- Merge with **squash** (`gh pr merge --squash --delete-branch`), only after the owner approves.

## Alternatives considered
- **Committing directly to `main`:** simpler, but there's no review step and no clean history of changes.
- **Merge commits or rebase merges:** squash gives one readable commit per pull request on `main`, which suits a
  solo owner learning Git.

## Consequences
- `main` history is one commit per pull request, and the pull request number is in each summary.
- Squash merges rewrite the branch's commits. This is why stacked pull requests break (see 0003).
