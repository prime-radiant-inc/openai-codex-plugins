# Task File Template

Use this structure for each task file in the `tasks/` subfolder. Each task file must be **fully self-contained** — a coder agent reading only this file should know exactly what to implement, why, and how.

## Template

```markdown
# Task {nn}: {Title}

## Status

pending

## Phase

{N}

## Description

{2-5 sentences describing what this task accomplishes and why it matters in the context of the overall feature. Include enough context that an agent unfamiliar with the planning conversation understands the purpose.}

## Dependencies

**Depends on:** {Comma-separated list of task filenames, or "None (Phase 1)"}
**Blocks:** {Comma-separated list of task filenames, or "None"}

**Context from dependencies:** {Prose summary of what the dependency tasks produce that this task needs. For example: "task-01-setup-database.md creates the PostgreSQL schema with users and sessions tables. This task builds the API routes that query those tables." This is what makes each file self-contained — the agent does not need to read other task files to understand its inputs.}

## Domain Context

- **Glossary terms:** {Canonical terms from CONTEXT.md or context-specific glossary that this task must use}
- **Avoided synonyms:** {Terms the task should not use, or "None"}
- **ADR constraints:** {Accepted ADRs or durable decisions relevant to this task, or "None"}

## Files to Create

- `path/to/new-file.ts` — {Brief purpose}
- `path/to/another-file.ts` — {Brief purpose}

## Files to Modify

- `path/to/existing-file.ts` — {What changes and why}

## Technical Details

{All implementation-specific details from the planning conversation. This section is the single source of truth. Include:}

### Implementation Steps

1. {Step-by-step instructions with enough detail for independent implementation}
2. {Include CLI commands where relevant: `pnpm add package-name`}
3. {Include code snippets for non-obvious patterns}

### Code Snippets

{Key type definitions, schemas, configuration blocks, or patterns that the implementer needs. Use fenced code blocks with language tags.}

### Environment Variables

{If applicable:}
- `VAR_NAME` — {Purpose and example value}

### API Endpoints

{If applicable:}
- `METHOD /path` — {Request/response shape}

## Verification Plan

### RED

- Command: `{command that should fail or expose the missing behavior before implementation}`
- Expected: {What failure or absence proves the task is not already complete}

### GREEN

- Command: `{targeted command that proves this task's behavior after implementation}`
- Expected: {What passing output or observable result proves the task is implemented}

### Final Verification

- Command: `{project-level check such as npm test, pnpm lint && pnpm typecheck, or equivalent}`
- Expected: {What passing output proves the task integrates with the rest of the project}

## Acceptance Criteria

- [ ] {Criterion 1 — specific and verifiable}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

## Notes

{Any additional context, edge cases, warnings, or architectural decisions relevant to this task. Omit this section if there's nothing to add.}
```

## Key Points

- The **Status** field is updated by the `build-feature` skill. Allowed values are `pending`, `in-progress`, `blocked`, `needs-context`, `done-with-concerns`, `review-failed`, and `complete`.
- The **Dependencies** section includes prose context (not just filenames) so the agent understands its inputs without reading other files. This is the most important part of making task files self-contained.
- The **Domain Context** section carries glossary and ADR constraints into the coder prompt. It should not contain feature requirements or implementation steps.
- **Files to Create** and **Files to Modify** make the task's scope explicit. Tasks in the same Phase should not overlap on these lists.
- **Technical Details** captures everything from the planning conversation — CLI commands, schemas, code snippets, file paths, env vars, API endpoints. If it was discussed during planning and is relevant to this task, it belongs here.
- **Verification Plan** keeps testing tied to implementation. RED proves the gap, GREEN proves the task, and Final Verification proves integration.
- **Acceptance Criteria** should be specific enough that completion can be verified objectively (by a code review agent or a human).
