# Design It Twice

Use this when the right seam or interface is not obvious.

## Process

1. Sketch two materially different interface options.
2. For each option, list what callers must know.
3. For each option, list what behavior becomes local to the implementation.
4. Identify the tests that would exercise the interface.
5. Choose the option with better leverage and locality, unless a concrete constraint outweighs it.

## Comparison Table

```markdown
| Option | Interface | Caller Knowledge | Locality Gain | Risks |
|--------|-----------|------------------|---------------|-------|
| A | ... | ... | ... | ... |
| B | ... | ... | ... | ... |
```

Do not invent a third option just for symmetry. Two serious designs are enough to expose the trade-off.
