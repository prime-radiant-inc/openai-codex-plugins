# CONTEXT.md Format

Use this shape for project or bounded-context glossary files.

```markdown
# Context: {Context Name}

## Purpose

{One paragraph describing what this context owns in domain language.}

## Glossary

### {Canonical Term}

{One or two sentence domain definition.}

_Avoid_: {Rejected synonym}, {another rejected synonym}

_Related decisions_: [ADR-0001](docs/adr/0001-example.md)
```

Rules:

- Keep implementation details out.
- Prefer short definitions over essays.
- Add terms only when the conversation or codebase needs them.
- Use `_Avoid_` to prevent synonym drift.
