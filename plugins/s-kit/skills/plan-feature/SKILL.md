---
name: plan-feature
description: >
  Create a structured feature specification with design context and self-contained task files organized into
  parallel execution Phases. Use this skill after brainstorming has produced an approved docs/design/YYYY-MM-DD-{feature-name}/design.md,
  or when the user provides an existing approved design.md and asks to turn it into actionable task
  Phases. This skill produces local spec files under docs/specs/YYYY-MM-DD-{feature-name}/ using the same dated folder name as the design — no GitHub integration.
---

# Plan Feature

Transform an approved design into a structured spec folder that enables parallel agent implementation. The approved design lives under `docs/design/YYYY-MM-DD-{feature-name}/design.md`; the generated spec uses the matching `docs/specs/YYYY-MM-DD-{feature-name}/` folder and breaks the feature into self-contained task files — each one detailed enough that a coder agent can pick it up cold and implement it without reading anything else.

The key insight: implementation plans that live in a single file are either too large for a context window or too shallow for independent execution. By splitting into one file per task with full context in each, we enable multiple agents to work in parallel while keeping each agent's context focused.

## When to Use

- After `brainstorming` has produced an approved `docs/design/YYYY-MM-DD-{feature-name}/design.md`
- When the user provides an existing approved design file that can be placed under `docs/design/YYYY-MM-DD-{feature-name}/design.md`
- When the user wants to turn an approved design into task Phases for implementation

## Instructions

### Step 1: Verify Approved Design

`plan-feature` does not interview the user or discover requirements from scratch. `brainstorming` owns discovery and approval.

Before writing requirements or tasks:

1. Find the approved `design.md` in `docs/design/YYYY-MM-DD-{feature-name}/design.md`, or use the explicit design path supplied by the user after placing it in that structure.
2. Confirm the design is approved. Approval can be explicit in the current conversation, stated in the design document, or inherited from the immediately preceding `brainstorming` handoff.
3. If no approved design exists, stop and invoke `brainstorming` first. Do not ask standalone requirements-interview questions from `plan-feature`.
4. Read `design.md` and use it as the source of truth. Review the current conversation only to preserve approved details that are missing from the file.
5. Derive the spec folder name from the design folder name. For example, `docs/design/2026-05-27-add-user-auth/design.md` becomes `docs/specs/2026-05-27-add-user-auth/`.
6. Read `CONTEXT-MAP.md`, relevant `CONTEXT.md` files, and ADRs in `docs/adr/` when present. Treat glossary terms and ADR constraints as part of the planning input, not optional background.

Before writing any spec file, verify the design file exists at the derived path (`docs/design/YYYY-MM-DD-{feature-name}/design.md`). If it does not, report the exact expected path and stop. Do not create the spec folder, and do not guess an alternative location.

### Step 2: Derive the Spec Folder

Do not choose a new feature name in `plan-feature`. Reuse the exact dated folder name already chosen by `brainstorming` under `docs/design/`.

Example: `docs/design/2026-05-27-add-user-auth/design.md` expands to `docs/specs/2026-05-27-add-user-auth/`.

### Optional: Map Existing Patterns First

Before decomposing into tasks, offer to dispatch the `s-kit-pattern-mapper` agent with the approved design as input. Its report (recommended patterns with file:line evidence, implementation guidance, watchouts) feeds directly into each task file's Technical Details so coder agents follow the repo's real conventions instead of inventing a style. Skip this for repos the conversation already knows well.

### Step 3: Decompose into Tasks

Break the implementation into atomic tasks. Each task should:
- Be completable in a single coding session by one agent
- Have a clear, specific scope (one concern per task)
- Produce working, testable code when complete
- Not overlap in files modified with other tasks in the same Phase

Think carefully about granularity. Too coarse and agents can't work in parallel. Too fine and the overhead of context-switching between tasks dominates. A good task typically creates or modifies 1-5 files around a single concern.

Do NOT create standalone testing-only tasks unless the user explicitly asks for them. Every implementation task still needs objective acceptance criteria and a verification step when correctness can be checked locally.

### Step 4: Build the Dependency Graph

For each task, identify:
- **What it depends on**: which tasks must complete before this one can start
- **What depends on it**: which tasks are blocked until this one finishes

Tasks with no dependencies form Phase 1. Tasks whose dependencies are all in Phase 1 form Phase 2. And so on. All tasks within a Phase can execute in parallel.

When assigning Phases, verify that tasks within the same Phase do not modify overlapping files. If two tasks in the same Phase would touch the same file, move one to a later Phase — parallel agents on the same branch cannot safely modify the same file.

### Step 5: Create the Spec Folder

Create the following structure at `docs/specs/YYYY-MM-DD-{feature-name}/`, using the same dated feature folder name as the source design:

```
docs/specs/YYYY-MM-DD-{feature-name}/
├── README.md
├── spec.json
├── requirements.md
├── action-required.md
├── implementation-log.md
└── tasks/
    ├── task-01-{name}.md
    ├── task-02-{name}.md
    └── ...
```

Read the templates in `references/` before writing each file:
- `references/readme-template.md` — for the README (dependency graph, Phase table, status tracking)
- `references/spec-json-template.json` — for the machine-readable manifest
- `references/task-template.md` — for each task file (self-contained with all context)
- `references/requirements-template.md` — for the requirements document
- `references/action-required-template.md` — for manual human steps

Task files are numbered with zero-padded two-digit prefixes in topological order: Phase 1 tasks first, then Phase 2, etc. Within a Phase, order is arbitrary but stable.

Use these task statuses exactly:
- `pending` — not started
- `in-progress` — currently assigned or being worked
- `blocked` — cannot proceed without user action or an external environment change
- `needs-context` — implementation needs clarification or missing project context
- `done-with-concerns` — implementation is complete but review concerns remain
- `review-failed` — a spec or code review failed and fixes are required
- `complete` — accepted after required review and verification

`done-with-concerns` and `review-failed` are execution-only statuses assigned by `build-feature` during implementation and review. `plan-feature` always creates tasks as `pending`; the full list stays in `spec.json.allowedTaskStatuses` because `build-feature`'s preflight requires exactly these seven values.

### Step 6: Write Self-Contained Task Files

This is the most important step. Each task file is the **only thing** a coder agent will read before implementing. It must contain everything the agent needs:

- **Description**: what to build and why it matters in context
- **Dependency context**: what prior tasks produce that this task needs (summarized in prose, not just filenames). The agent should not need to read other task files.
- **Domain context**: glossary terms, avoided synonyms, context boundaries, and ADR constraints relevant to the task
- **Technical details**: CLI commands, code snippets, schemas, file paths, env vars, API endpoints — every implementation-specific detail from the planning conversation
- **Files to create/modify**: explicit list with purpose for each
- **Verification plan**: RED/GREEN/final verification commands and expected results
- **Acceptance criteria**: specific, verifiable conditions

Review each task file with fresh eyes: could an agent who has never seen the planning conversation implement this correctly using only this file? If not, add what's missing.

### Step 7: Write the Manifest and Execution Log

Create `spec.json` as the source of truth for orchestration. It must match the README and task files:

- `feature`, `created`, `designPath`, `specPath`, `requirementsPath`, `actionRequiredPath`, and `implementationLogPath`
- `allowedTaskStatuses` with the exact statuses from Step 5
- `tasks[]` entries with `id`, `title`, `file`, `phase`, `status`, `dependsOn`, `blocks`, `files.create`, `files.modify`, and `verificationCommands`

The manifest owns folder naming, task IDs, Phases, status values, file ownership, and verification commands. README checkboxes and task file metadata must mirror the manifest, not diverge from it.

Create `implementation-log.md` with approval evidence first. Record design approval before spec creation in `implementation-log.md`. Do not write a "Spec Created" entry before approval evidence.

The initial log must contain entries in this order:

1. `## YYYY-MM-DD - Design Approved`
   - Approved design path.
   - How approval was confirmed, such as current-conversation approval, explicit document status, or the immediately preceding `brainstorming` handoff.
   - Any optional `grill-me` outcome if used, or that it was declined or skipped.
2. `## YYYY-MM-DD - Spec Created`
   - Which approved design it came from.
   - Initial task and Phase count.

Future implementation runs append Phase starts, task results, review outcomes, verification evidence, blockers, and final integration notes here.

### Step 8: Extract Manual Actions

Identify any steps that require human action (account creation, API key setup, DNS configuration, environment variables, third-party service registration, etc.). Write these to `action-required.md` grouped by timing (Before/During/After implementation). If none exist, note "No manual steps required."

### Step 9: Report to User

After creating the spec, display:

```
Feature specification created at docs/specs/YYYY-MM-DD-{feature-name}/

Files created:
- README.md (dependency graph, {N} Phases, {T} tasks)
- spec.json (manifest for orchestration and verification)
- requirements.md
- action-required.md
- implementation-log.md
- tasks/ ({T} task files)

Phase breakdown:
- Phase 1: {count} tasks (parallel) — {brief description}
- Phase 2: {count} tasks (parallel) — {brief description}
- ...

Next steps:
1. Review action-required.md for tasks you need to complete manually
2. Review the approved design, requirements, and task files
3. Use /build-feature to start implementation
```

## Critical Rules

- Every task file must be fully self-contained — this is the entire point of the spec structure. A coder agent reading only that file must know exactly what to do.
- Capture ALL technical details from the planning conversation. The spec is the single source of truth — CLI commands, schemas, code snippets, file paths, env vars, API endpoints. Anything not captured here is lost.
- Capture glossary and ADR constraints from `CONTEXT.md`, `CONTEXT-MAP.md`, and `docs/adr/` in requirements and task files when those docs exist. Do not invent synonyms for canonical terms.
- `spec.json` is the machine-readable orchestration contract. Keep it consistent with README checkboxes, task file status/Phase fields, file ownership, and verification commands.
- Every task needs a `## Verification Plan` with `### RED`, `### GREEN`, and `### Final Verification` subsections.
- Tasks within the same Phase must not modify overlapping files. Parallel agents on the same branch cannot safely touch the same files.
- Keep tasks atomic — one concern per task. If a task has more than 5-7 files to modify, consider splitting it.
- Do not create standalone testing-only tasks unless the user explicitly asks for them; keep verification inside the relevant implementation task.
- Number task files in topological order (Phase 1 first, then Phase 2, etc.) for easy scanning.
