---
name: quick-change
description: Use when a requested change is small, clear, low risk, and directly verifiable, and when the full dated design/spec workflow would add unnecessary ceremony.
---

# Quick Change

## Overview

Use this lane for small scoped work where the desired outcome is already clear. The goal is speed with evidence, not casual editing.

## When to Use

Use when all of these are true:

- The requested outcome is clear.
- The expected change is low blast radius, roughly 1-3 files.
- No design, architecture, or ownership decision is needed.
- A direct verification command is available or can be discovered.

Do not use this lane for broken behavior, failing tests, regressions, broad refactors, or ambiguous feature work.

## Workflow

1. State assumptions and success criteria.
2. Inspect `git status --short`.
3. Read the relevant files before editing.
4. Name the verification command before editing when knowable.
5. Make the smallest scoped change.
6. Use `s-kit:test-driven-development` first if behavior changes and a correct test seam exists.
7. Remove only unused code introduced by this change.
8. Use `s-kit:verification-before-completion` before any completion claim.
9. Use `s-kit:requesting-code-review` when behavior changed, the diff is nontrivial, or the area is security-sensitive or workflow-sensitive.
10. Report changed files, verification evidence, review status if used, and residual risk.

## Escalation

Stop and reroute when the work no longer fits the lane:

| Signal | Route |
|--------|-------|
| Broken behavior, failing command, failing test, or regression | `systematic-debugging` |
| Design questions, unclear ownership, or wider blast radius | `brainstorming` |
| Architecture terminology or domain-model pressure needed | `grill-with-docs` or `brainstorming` |
| Delivery intent after committed work | `ship-it` |

Quick changes do not create dated `docs/design/` or `docs/specs/` folders. If the change needs those artifacts, it is no longer a quick change.

## Common Mistakes

| Mistake | Correction |
|---------|------------|
| Treating a small bug diff as quick work | Bugs use `systematic-debugging` even when the patch is tiny. |
| Starting edits before reading the target files | Read first, then edit. |
| Skipping verification because the change is small | Small changes still need fresh evidence. |
| Expanding into nearby cleanup | Keep unrelated cleanup out of the diff. |

## Related Skills

- `s-kit:systematic-debugging` - for defects and failed commands.
- `s-kit:test-driven-development` - for behavior changes with a test seam.
- `s-kit:verification-before-completion` - for fresh proof before completion claims.
- `s-kit:requesting-code-review` - for review when risk warrants.
