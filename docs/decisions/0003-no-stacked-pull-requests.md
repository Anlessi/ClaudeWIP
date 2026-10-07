# 0003: No stacked pull requests

- **Status:** Accepted (2026-10-06)
- **Links:** Anlessi/ClaudeWIP#9, background in #6, #7 and #8

## Context
The "follow the real date" pull request (#7) was built on the weather branch (#6). Merging #6 with
`--delete-branch` made GitHub close #7 instead of moving it to `main`. Because squash merges give `main` a
different history, merging `main` into the branch then conflicted too. The work had to be re-applied and
opened again as #8.

## Decision
A pull request's base is always `main`. If a change depends on one that is still open, the first one is merged
before the next branch is started from the updated `main`. To recover, make a fresh branch from `main`,
`git cherry-pick` the commits, and open a new pull request.

## Alternatives considered
- **Stacking and retargeting by hand:** works, but it's easy to get wrong with squash merges and a new Git user.

## Consequences
- Dependent features are done one after another, with a merge in between (for example #14, then name colours).
