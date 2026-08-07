---
name: codebase-design
description: Use when designing module interfaces, choosing seams, improving architecture, deepening shallow modules, or making code more testable and AI-navigable
---

# Codebase Design

Design deep modules: a lot of behavior behind a small interface, placed at a clean seam, testable through that interface. Use this vocabulary consistently when planning, reviewing, or refactoring architecture.

## Vocabulary

| Term | Meaning |
|------|---------|
| Module | Anything with an interface and implementation: a function, class, package, workflow, or tier-spanning slice. |
| Interface | Everything callers must know: types, invariants, order constraints, error modes, configuration, and performance characteristics. |
| Implementation | What sits behind an interface. |
| Seam | A place where behavior can change without editing that place. The seam is where the interface lives. |
| Adapter | A concrete implementation that fills a seam. |
| Depth | How much useful behavior sits behind each unit of interface a caller must learn. |
| Leverage | More capability per unit of interface. |
| Locality | Change, bugs, and verification concentrated in one place. |

Prefer these terms over vague words like component, service, API, or boundary when the design question is architectural.

## Principles

- A deep module has a small interface and a substantial implementation.
- A shallow module exposes nearly as much interface complexity as it hides.
- The interface is the main test surface.
- One adapter is a hypothetical seam; two adapters prove the seam is real.
- Extracting code only for testability can reduce locality if callers still coordinate the real behavior.
- Good seams follow domain language from `CONTEXT.md` and respect ADRs.

## Design Loop

1. Name the behavior the caller wants, not the files involved.
2. Identify what callers currently need to know.
3. Move ordering, validation, branching, and error interpretation behind the smallest useful interface.
4. Test through the interface that production callers use.
5. Apply the deletion test: if deleting a wrapper just moves complexity to callers, it was shallow.
6. Compare at least two plausible interface shapes when the seam is not obvious.

Use `DEEPENING.md` for refactor candidates and `DESIGN-IT-TWICE.md` when choosing between competing interfaces.

## When Not to Use

- Small mechanical edits with no interface question.
- Pure bug diagnosis before a tight reproduction exists.
- Rewriting a module because it feels old but no caller complexity is identified.

## Common Mistakes

| Mistake | Correction |
|---------|------------|
| Calling every class a service | Name the module by the domain behavior it hides. |
| Adding an abstraction for one caller | Wait until the seam buys leverage or locality. |
| Testing private helpers | Test through the interface callers use. |
| Moving complexity sideways | Deepen the module or leave it alone. |
