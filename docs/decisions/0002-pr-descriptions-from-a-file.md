# 0002: Pass pull request descriptions to gh from a file

- **Status:** Accepted (2026-10-06)
- **Links:** Anlessi/ClaudeWIP#3

## Context
Windows PowerShell 5.1 mangles double quotes inside arguments passed to native programs. A `--body` description
containing quotes broke `gh pr create` when opening Anlessi/ClaudeWIP#2.

## Decision
Write the pull request description to a file in the scratchpad directory, then use `gh pr create --body-file <file>`.

## Alternatives considered
- **Escaping quotes in `--body`:** fragile and easy to get wrong.
- **Using PowerShell 7 or Git Bash everywhere:** not always the shell in use.

## Consequences
- The description file is a natural checkpoint: the `require-wrap-up` hook reads it (see 0004).
