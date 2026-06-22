---
name: maintainability-review
description: Use only when explicitly requested for an unusually strict maintainability review of a branch, PR, commit range, changed files, or recent code-quality work.
disable-model-invocation: true
---

# Maintainability Review

Use this for a harsh maintainability review. Start from the changed work, but inspect nearby code when needed to find simpler existing patterns, canonical helpers, missing test seams, or ownership boundaries.

The goal is not to find more nits. The goal is to find the highest-leverage changes that make the implementation simpler, easier to test, easier for future agents to navigate, and harder to accidentally break.

## Process

1. Define the review scope: branch, PR, commit range, changed files, or requested files.
2. Read the user request, spec, or acceptance criteria before judging the code.
3. Inspect the diff, then follow references into surrounding modules when a better structure may already exist.
4. Prioritize structural findings over local style issues.
5. Return PASS only when no clear blocker remains under the approval bar.

## Review Priorities

Findings should be ordered by impact:

1. Structural regressions that make the codebase harder to change.
2. Missed simplifications that could delete branches, modes, layers, or duplicated concepts.
3. Testability gaps, brittle tests, missing seams, or slow feedback loops.
4. Spaghetti growth from scattered conditionals, flags, special cases, or partial refactors.
5. Boundary, type, contract, or canonical-ownership problems.
6. Oversized files or modules that became harder to navigate.
7. Lower-risk maintainability and legibility issues.

Do not spend review budget on cosmetic comments while larger structural issues exist.

## What to Check

For each meaningful change, ask:

- Can the same behavior be expressed with fewer concepts, branches, helpers, or layers?
- Did the change use the codebase's existing ownership boundaries, utilities, and patterns?
- Did it add special-case conditionals to a flow that should have gained a clearer model or abstraction?
- Did it make a file, component, prompt, or module too large for future agents to navigate confidently?
- Did it introduce weak contracts: unnecessary optionality, casts, loosely shaped data, silent fallbacks, or unclear invariants?
- Did it make tests easier to write and understand, or did it hide behavior behind awkward setup and brittle integration paths?
- Are the tests checking the behavior that matters, or only proving the current implementation shape?
- Did the change preserve fast, local feedback for future edits?
- Are independent operations serialized or partial updates allowed when a simpler atomic structure is available?
- Did a refactor actually reduce the number of concepts a reader must hold, or merely move complexity around?

## What to Flag Aggressively

Treat these as important findings unless the code gives a strong reason:

- A complex implementation where a cleaner reframing could delete whole categories of complexity.
- Feature-specific logic leaking into shared or canonical paths.
- New flags, nullable modes, or scattered conditionals that make an existing flow harder to reason about.
- Files crossing roughly 1000 lines because of the change, or large files growing without decomposition.
- Thin wrappers, pass-through helpers, generic machinery, or "magic" abstractions that do not buy clarity.
- Duplicated helpers, prompts, policies, or data shaping where a canonical utility already exists.
- Cast-heavy, optional-heavy, or fallback-heavy code that obscures the real contract.
- Tests that require excessive setup because the production code lacks a useful seam.
- Important behavior without focused regression coverage.
- Refactors that pass tests but leave the next change harder to make safely.

Ambitious reviews will produce some false positives. That is acceptable. Missing a real structural opportunity is more costly than asking the author to justify one rejected suggestion.

## Preferred Remedies

Prefer remedies that reduce total system complexity:

- Delete an unnecessary layer instead of polishing it.
- Reframe the data or state model so branches disappear.
- Move logic to the module, package, prompt, or policy that already owns the concept.
- Split a large file into focused modules with names that carry useful context.
- Replace repeated conditionals with an explicit typed model, dispatcher, policy, or pure helper.
- Reuse an existing canonical helper instead of creating a near-duplicate.
- Make type and data boundaries explicit so control flow gets simpler.
- Add or expose a test seam that lets important behavior be verified without brittle end-to-end setup.
- Turn slow or awkward verification into focused regression tests where feasible.
- Make related updates atomic when partial state would be harder to reason about.

## Boundaries

- Do not implement fixes unless the user explicitly asks for fixes.
- Do not broaden the task into a full architecture redesign.
- Do not demand abstraction for its own sake; direct boring code is better than clever indirection.
- Do not reject duplication automatically when independent prompts, docs, or adapters intentionally need separate ownership.
- Do not treat performance micro-optimizations as blockers unless they also simplify the design or remove real risk.
- Do not approve work that lacks credible verification evidence; name the gap instead.

## Output

Report findings first. Each finding should include:

- severity: Blocking, Important, or Informational
- location: file path and line when possible
- problem: the structural issue, not just the local symptom
- impact: why future changes, tests, or reviews become harder
- expected fix: the smallest structural remedy that would resolve it

If there are no findings, say so clearly and list the evidence reviewed plus residual risk.

## Approval Bar

Return FAIL when any of these remain without a clear justification:

- The code works but makes the codebase meaningfully messier.
- A visible simplification could remove substantial complexity.
- Special-case branching spreads through unrelated code.
- A file or module grows past a healthy size boundary without decomposition.
- Tests miss important behavior or require brittle setup because the design has no useful seam.
- Weak contracts hide real invariants behind casts, optional fields, fallback behavior, or loosely shaped objects.
- The change duplicates canonical helpers or places logic in the wrong layer.

Return PASS only when the remaining concerns are minor, verified, and not likely to make the next change harder.
