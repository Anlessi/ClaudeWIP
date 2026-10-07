# 0004: Keep decisions and context in the repository, updated by /wrap-up before every pull request

- **Status:** Accepted (2026-10-07)
- **Links:** `CLAUDE.md` "Decisions and context", `.claude/skills/wrap-up/`, `.claude/hooks/require-wrap-up.js`

## Context
Every new Claude session started from zero. The code and Git history show *what* changed, but not *why*: rejected
options, the owner's preferences, parked ideas. The owner had to repeat earlier decisions.

## Decision
Three layers, all in the repository:
1. `CLAUDE.md` for the rules (loaded automatically).
2. `<project>/docs/CONTEXT.md`, a one-page current-state briefing per project, imported by the project's
   `CLAUDE.md` so it loads automatically. There's also `IDEAS.md` for ideas we haven't built.
3. Decision records (`docs/decisions/NNNN-*.md`), at repository level and per project. Each folder has a
   `README.md` index that loads automatically, and a record is opened only when relevant.

The `wrap-up` skill updates these before every pull request and writes the description with a `## Decisions`
section. A `PreToolUse` hook blocks `gh pr create` if the description file lacks that section, so the step
can't be forgotten.

## Alternatives considered
- **A per-session diary:** grows quickly, goes stale, and is slow to read. Rejected by the owner.
- **Claude's private memory only:** not versioned, not reviewable, and tied to one computer and folder path.
  It's kept only for personal working preferences.
- **A checklist in `CLAUDE.md` without a skill or hook:** easy to forget. The owner wanted it automatic.

## Consequences
- Every pull request also updates documentation, and the owner reviews both together.
- Past decisions were reconstructed from pull requests #1–#14 and earlier session transcripts.
- The hook only checks that the `## Decisions` section exists. Whether the docs are good is checked in review.
