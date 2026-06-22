---
name: grill-with-docs
description: Use when a plan needs to be stress-tested against project language, CONTEXT.md, ADRs, existing code, or documented domain decisions before design approval or task planning.
---

# Grill With Docs

Use this to challenge a proposed plan against the project's durable language and decisions. The goal is not to produce an implementation plan. The goal is to make unclear terms, boundaries, and architectural trade-offs precise before they become feature design or spec material.

Use `domain-modeling` for the active glossary and ADR mechanics in this session: canonical terms, rejected synonyms, context docs, and ADR thresholds. `grill-with-docs` owns the interview pressure; `domain-modeling` owns the durable language rules.

## When to Use

- The user asks to grill, challenge, stress-test, or sharpen a plan against docs.
- A plan depends on domain terms that may already be defined in `CONTEXT.md`.
- A design touches bounded contexts, ownership boundaries, or cross-context relationships.
- The work may create an ADR-worthy decision.
- `brainstorming` has surfaced terminology or architecture ambiguity that should be resolved before writing `docs/design/YYYY-MM-DD-{feature-name}/design.md`.

Do not use this for ordinary implementation, bug fixes, or pure task decomposition. If a design is already approved and terminology is stable, continue with `plan-feature`.

## Documentation Sources

Before asking questions, inspect the docs that already answer them:

- `CONTEXT-MAP.md` at the repo root means multiple contexts. Read it to find the relevant context docs.
- `CONTEXT.md` at the repo root means one context.
- Context-specific `CONTEXT.md` files may live beside source folders.
- ADRs usually live in `docs/adr/`.
- s-kit feature designs live under `docs/design/YYYY-MM-DD-{feature-name}/design.md`.
- s-kit feature specs live under `docs/specs/YYYY-MM-DD-{feature-name}/`.

Create files lazily. If no `CONTEXT.md` exists, create one only after a term is resolved. If no `docs/adr/` exists, create it only when the first ADR is justified.

## Session Loop

1. Read the relevant context docs, ADRs, design/spec files, and nearby code.
2. If the answer is discoverable from the repo, inspect the repo instead of asking.
3. Ask one focused question at a time.
4. Include your recommended answer with each question.
5. Use concrete scenarios to expose edge cases and boundary confusion.
6. When a term is resolved, update the relevant `CONTEXT.md` immediately using `domain-modeling` rules.
7. When a decision meets the ADR threshold, offer an ADR and write it if accepted using `domain-modeling` rules.
8. If this is part of `brainstorming`, carry resolved terms and decisions into the final design.

## Language Rules

`CONTEXT.md` is a glossary, not a spec.

- Define domain terms only. Do not document generic programming concepts.
- Keep definitions to one or two sentences.
- Define what the term is, not implementation behavior.
- Pick one canonical term and list rejected synonyms under `_Avoid_`.
- Call out mismatches immediately: if docs say "Customer" and the user says "Account" for the same thing, ask which term is canonical.

Use `skills/domain-modeling/CONTEXT-FORMAT.md` for the file shape.

## ADR Threshold

Create or offer an ADR only when all three are true:

1. The decision is hard to reverse.
2. The choice would surprise a future reader without context.
3. There was a real trade-off between plausible alternatives.

If any condition is missing, skip the ADR. Use `skills/domain-modeling/ADR-FORMAT.md` when an ADR is warranted.

## Handoff

End with the useful residue:

- resolved canonical terms
- doc files changed
- ADRs created or proposed
- design/spec implications
- open questions that still block approval
