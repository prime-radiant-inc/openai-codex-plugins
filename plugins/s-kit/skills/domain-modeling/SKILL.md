---
name: domain-modeling
description: Use when project terminology, ubiquitous language, context boundaries, glossary entries, or ADR-worthy domain decisions need to be clarified or recorded
---

# Domain Modeling

Use this skill to actively maintain a project's domain model while designing or triaging work. Reading `CONTEXT.md` for vocabulary is just a habit; this skill applies when the model itself changes or needs pressure.

## When to Use

- The same concept has multiple names in conversation, code, docs, or issues.
- A term is fuzzy, overloaded, or conflicts with `CONTEXT.md`.
- A design depends on bounded contexts, ownership, or cross-context relationships.
- A decision may need an ADR so future agents do not reopen it.

Do not use this for ordinary implementation or generic refactoring. If the work is a feature design, use `brainstorming` and call this skill only for the terminology and decision-recording parts.

## Source Files

- `CONTEXT-MAP.md` at the repo root means multiple contexts. Read it to find the relevant glossary.
- `CONTEXT.md` at the repo root means one context.
- Context-specific `CONTEXT.md` files may live beside source folders.
- ADRs usually live in `docs/adr/` or a context-specific `docs/adr/`.

Create files lazily. Create `CONTEXT.md` only after a term is resolved. Create `docs/adr/` only when the first ADR is accepted.

## Session Loop

1. Read existing context docs, ADRs, nearby code, and any design/spec files in scope.
2. Challenge conflicting or overloaded terms immediately.
3. Propose one canonical term and list rejected synonyms.
4. Test the term with concrete scenarios and edge cases.
5. Cross-check claims against code when the answer is discoverable.
6. Update the relevant `CONTEXT.md` as soon as a term is resolved.
7. Offer an ADR only when the threshold below is met.
8. Hand resolved language back to the active design, spec, issue, or review.

## Glossary Rules

`CONTEXT.md` is a glossary, not a spec.

- Define domain terms only; skip generic programming concepts.
- Keep definitions to one or two sentences.
- Define what the term is, not implementation behavior.
- Pick one canonical term and list rejected synonyms under `_Avoid_`.
- Link ADRs only when they explain why the term exists or why alternatives were rejected.

Use `CONTEXT-FORMAT.md` for file shape.

## ADR Threshold

Offer or create an ADR only when all three are true:

1. The decision is hard to reverse.
2. A future reader would be surprised without context.
3. There is a real trade-off between plausible alternatives.

If any condition is missing, do not write an ADR. Use `ADR-FORMAT.md` when an ADR is warranted.

## Common Mistakes

| Mistake | Correction |
|---------|------------|
| Treating `CONTEXT.md` as a feature spec | Put behavior and implementation details in design/spec files. |
| Recording every small preference as an ADR | ADRs are for durable trade-offs, not meeting notes. |
| Accepting synonyms to be polite | Choose one canonical term and list avoided synonyms. |
| Asking when code can answer | Inspect code first, then ask about genuine ambiguity. |
