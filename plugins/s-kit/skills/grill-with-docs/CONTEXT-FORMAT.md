# CONTEXT.md Format

Use `CONTEXT.md` as an implementation-free glossary for the project or context.

```md
# {Context Name}

{One or two sentences describing what this context is and why it exists.}

## Language

**Order**: A request from a customer to buy goods or services.
_Avoid_: Purchase, transaction

**Invoice**: A request for payment sent after billable work or delivery.
_Avoid_: Bill, payment request
```

## Rules

- Be opinionated. Pick one canonical term and list weaker synonyms under `_Avoid_`.
- Keep definitions tight. One or two sentences is enough.
- Include only domain terms specific to this project.
- Do not include implementation details, API shapes, task status, or feature requirements.
- Add subheadings only when natural clusters emerge.

## Single vs Multiple Contexts

For a single-context repo, keep one root `CONTEXT.md`.

For multiple contexts, create a root `CONTEXT-MAP.md` that links each context and describes relationships:

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) - receives and tracks customer orders
- [Billing](./src/billing/CONTEXT.md) - generates invoices and records payment status

## Relationships

- **Ordering -> Billing**: Ordering emits order events; Billing references orders by ID.
```
