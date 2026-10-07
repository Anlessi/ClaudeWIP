---
name: wrap-up
description: Record the decisions, current state and parked ideas from this session in the repository's docs, then write the pull request description. Run before every `gh pr create` in this repository (a hook enforces it), or when the owner asks to wrap up, save context or record decisions.
---

# Wrap-up: record decisions and context before a pull request

The goal is that the next session can start from the docs alone, without the owner repeating anything.
Keep all text short, plain and in the owner's language level (they are new to Git; see `CLAUDE.md`).

## 1. Find what this branch changed

- `git diff --name-only origin/main...HEAD` and `git status --short` list the touched files.
- Work out which project folder(s) they belong to. Changes outside any project folder (`CLAUDE.md`, `.claude/`,
  `docs/`) are repository-wide.
- Re-read this conversation for: options we chose between, things the owner asked for or rejected, assumptions,
  limits we found, and ideas mentioned but not built.

## 2. Decision records

For each project (or the repository), the folder is `docs/decisions/`, and its `README.md` is the index.

- Write a record when we'd otherwise have to explain it again, or when we turned down a reasonable alternative.
  Skip small implementation details, which belong in code comments or the pull request.
- Use `decision-template.md` (next to this file). The number is the highest existing number plus one, with four
  digits. The file name is `NNNN-short-hyphenated-title.md`.
- Status is `Accepted (YYYY-MM-DD)` with today's date. Under Links, write "this pull request" until the number is
  known.
- If the change reverses or replaces an earlier decision, write a new record, set the old one's status to
  `Superseded by NNNN (YYYY-MM-DD)`, and update both rows in the index. Never delete a record.
- Add a row to the index for every new record.

## 3. Update `<project>/docs/CONTEXT.md`

It describes the state **after this pull request merges**, not the history:
- What's built (features), how it's built (structure, data sources, conventions), what's in progress, and what's
  next.
- Remove anything that is no longer true. Keep it under ~150 lines and link to records instead of repeating them.
- Update the "Last updated" line (date and pull request).

## 4. Update `IDEAS.md`

Add ideas that were discussed but not built, with the date and the key facts found (APIs checked, open
questions). Remove ideas this pull request builds, and those that became a decision.

## 5. Check and commit

- Re-read every changed doc against the code. A wrong doc is worse than none.
- Show the owner a short summary: "New decision records: ... CONTEXT.md: ... IDEAS.md: ...".
- Commit the docs on the same branch as their own commit, `docs: record decisions and context for <change>`,
  staging the files by name. Follow the commit rules in `CLAUDE.md`, including asking first unless the owner
  already asked for a pull request.

## 6. Write the pull request description

Write it to a file in the scratchpad directory (see `CLAUDE.md`), with the usual "What", "Why" and "Testing"
sections plus:

```markdown
## Decisions
- [0007: Short title](Family%20Activity%20Calendar%20App/docs/decisions/0007-short-title.md): one line on what was decided
```

If there are no new decisions, write `## Decisions` followed by `- None`, and say what was updated instead (for
example "CONTEXT.md updated"). The section heading must be exactly `## Decisions`, because the
`require-wrap-up` hook looks for it before allowing `gh pr create --body-file <file>`.

Pass the description file to `--body-file` as a full, written-out path. The hook reads the command text before
the shell runs it, so a path built from a variable (`$S/pr-body.md`, `$env:TEMP\...`) can't be found and the
pull request is blocked.
