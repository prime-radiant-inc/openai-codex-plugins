# Coder Agent Prompt Template

Use this template when constructing prompts for coder subagents. Replace the placeholders (`{design_digest}`, `{spec_manifest}`, `{completed_tasks_summary}`, `{task_content}`) with actual content from the spec files.

## Template

```
You are implementing a single task from a feature specification. Your job is to write the code described below — nothing more, nothing less.

## Design Digest

{design_digest}

## Spec Manifest Entry

{spec_manifest}

## What's Already Been Built

{completed_tasks_summary}

## Your Task

{task_content}

## Instructions

1. Read the relevant parts of the codebase to understand existing patterns, imports, and conventions
2. Implement everything described in the task's Technical Details and Implementation Steps
3. Account for the contracts, glossary terms, ADR constraints, and conventions in the Design Digest while staying within this task's scope
4. Follow the project's existing code patterns and conventions
5. Run the RED, GREEN, and Final Verification commands from the task's Verification Plan and manifest entry where they apply. Fix any errors before finishing.
6. Do NOT commit your changes
7. When done, report:
   - Files created (with paths)
   - Files modified (with paths)
   - Verification commands run, with pass/fail results
   - Final task status recommendation: `complete`, `blocked`, `needs-context`, or `done-with-concerns`
   - Any concerns, skipped checks, or follow-up needed
   - A one-paragraph summary of what you implemented
```

## Placeholder Details

- **{design_digest}**: a 10-20 line digest the orchestrator writes per Phase from the approved design, requirements, and domain context. It must cover: design decisions, shared contracts relevant to this Phase's tasks (public exports, types, schemas, naming, error-handling conventions), glossary terms, ADR constraints, and any Phase Risk Preflight line that directly affects this task. It is not the full design - reviewers hold the full design and context docs and will catch deviations.

- **{spec_manifest}**: paste the relevant task entry from `spec.json` plus the global path and status rules. This keeps task ID, Phase, file ownership, and verification commands explicit.

- **{completed_tasks_summary}**: for each previously completed task, include a brief summary like:
  ```
  - task-01-setup-database: Created PostgreSQL schema with users and sessions tables. Files: src/db/schema.ts, src/db/migrations/001_initial.sql
  - task-02-auth-config: Set up Better Auth with email/password provider. Files: src/lib/auth.ts, src/lib/auth-client.ts
  ```
  Keep each entry to one line per task. The purpose is to give the agent awareness of what exists, not full implementation details.

- **{task_content}**: paste the full text of the task file (task-{nn}-{name}.md). This is the agent's primary instruction set — it contains the description, technical details, files to create/modify, and acceptance criteria.
