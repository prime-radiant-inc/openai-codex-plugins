# ADR Format

ADRs live in `docs/adr/` and use sequential numbering:

```text
docs/adr/0001-short-decision-title.md
docs/adr/0002-another-decision.md
```

## Minimal Template

```md
# {Short Title}

{One to three sentences explaining the context, the decision, and why this option was chosen.}
```

## Optional Sections

Only include these when they add real value:

- `Status: proposed | accepted | deprecated | superseded by ADR-NNNN`
- `## Considered Options`
- `## Consequences`

## When to Write One

Write or offer an ADR only when all three are true:

1. The decision is hard to reverse.
2. The choice would surprise a future reader without context.
3. There was a real trade-off between plausible alternatives.

Good ADR topics include architectural shape, integration boundaries, technology choices with lock-in, scope ownership, deliberate deviations from common practice, and constraints not visible in code.
