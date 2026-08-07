# ADR Format

ADRs live in `docs/adr/` unless a context-specific ADR folder is already established.

File name:

```text
NNNN-kebab-case-title.md
```

Template:

```markdown
# ADR-NNNN: {Title}

Status: proposed | accepted | deprecated | superseded by ADR-NNNN

## Context

{What forced the decision and what constraints mattered.}

## Decision

{The chosen option.}

## Consequences

{Positive and negative consequences.}

## Alternatives Considered

- {Alternative} - {why rejected}
```

Write an ADR only for hard-to-reverse decisions that would surprise a future reader and involved a real trade-off.
