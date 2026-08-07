---
name: prototype
description: Use when a design question needs throwaway runnable evidence, such as validating state logic, business rules, interaction flow, or competing UI directions before implementation
---

# Prototype

A prototype is throwaway code that answers one design question. The question decides the shape. It is not a shortcut around `brainstorming`, `plan-feature`, or production verification.

## Pick the Branch

- Logic, state, business rules, parser behavior, or workflow transitions: use `LOGIC.md`.
- UI layout, interaction feel, visual hierarchy, or competing screen directions: use `UI.md`.

If the question is ambiguous and the user is unavailable, choose the branch that matches the surrounding code and state the assumption at the top of the prototype.

## Rules

1. Mark it clearly as prototype code in file names, route names, comments, or README text.
2. Put it close enough to the real code that context is visible, but keep it obviously disposable.
3. Provide one command to run it.
4. Keep state in memory by default.
5. Skip production polish: no broad error handling, abstractions, persistence, or full test suite unless those are the question.
6. Surface the relevant state after each action or variant switch.
7. Delete it or absorb the decision into real code when the question is answered.

## Workflow Integration

Use `prototype` during `brainstorming` when conversation alone cannot settle a design decision. After the prototype answers the question, capture the answer in the design, ADR, issue, or implementation notes. Do not leave prototype decisions only in throwaway code.

## Common Mistakes

| Mistake | Correction |
|---------|------------|
| Building production foundations in the prototype | Build only enough to answer the question. |
| Keeping prototype code without a verdict | Delete it or record the decision and absorb the useful parts. |
| Adding persistence by default | Use in-memory state unless persistence is the question. |
| Treating prototype success as implementation verification | Production code still needs normal tests and review. |
