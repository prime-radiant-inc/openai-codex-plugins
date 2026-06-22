# Deepening Reference

Use this checklist when proposing architecture improvements.

## Signals of a Shallow Module

- Callers must perform steps in a precise order.
- Callers translate internal error codes into domain meaning.
- Multiple call sites repeat the same validation or branching.
- Tests mock several internal collaborators to assert one behavior.
- A wrapper can be deleted without losing behavior.

## Deepening Move

1. Pick the caller-facing behavior.
2. Define the smallest interface that expresses that behavior.
3. Move repeated coordination behind that interface.
4. Keep adapters concrete until there are at least two real implementations.
5. Verify through the new interface.

## Report Shape

When proposing a deepening:

- **Files**: concrete files involved.
- **Problem**: caller complexity or poor locality.
- **Proposed seam**: where the interface should live.
- **Why deeper**: what behavior moves behind the interface.
- **Verification**: tests that should survive internal refactors.
