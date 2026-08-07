# Fix Agent Prompt Template

Use this template when constructing prompts for coder agents that fix issues found during code review. Replace the placeholders with actual content.

## Template

```
You are fixing specific issues found during review. Address every issue listed below — do not skip any.

## Issues to Fix

{issues}

## Phase Risk Preflight

{phase_risk_preflight}

## Boundary Context

{boundary_context}

## Original Task Context

{task_content}

## Instructions

1. Fix each issue listed above. The review provided file paths, line numbers, and suggested fixes — use those as your starting point.
2. Keep the issue source clear: simplification issues must restore a behavior-preserving simplification path; spec-compliance issues must align implementation with the task/design; code-quality issues must improve implementation quality without changing the approved scope.
3. Account for the Phase Risk Preflight, Boundary Context, glossary terms, and ADR constraints while fixing only the listed issues.
4. If the issues came from complete punch-list mode, address the full punch list for this task group before reporting success.
5. Run the task's targeted verification commands and the project's lint/typecheck commands after making fixes. Resolve any new errors your fixes introduce.
6. Do NOT commit your changes.
7. Do NOT make changes beyond what's needed to fix the listed issues. Stay within scope.
8. When done, report:
   - What you fixed (reference each issue)
   - Any files modified
   - Verification commands run, with pass/fail results
   - If you could NOT fix an issue, explain why
```

## Placeholder Details

- **{issues}**: the specific issues from the review that relate to this task. Include file paths, line numbers, descriptions, severity, and suggested fixes. Example:
  ```
  - Issue 1: src/api/users.ts:42 — Missing error handling for database connection failure — Severity: high — Suggested fix: wrap the query in try/catch and return a 500 response
  - Issue 2: src/api/users.ts:15 — Unused import 'Session' — Severity: low — Suggested fix: remove the import
  ```

- **{phase_risk_preflight}**: the Phase Risk Preflight for the current Phase. This helps the fix agent avoid resolving one issue while breaking a shared contract.

- **{boundary_context}**: same-boundary or complete punch-list context from the fix loop. Use `None` when the fix is from a normal first-pass review failure.

- **{task_content}**: the full text of the original task file for context. The fix agent may need to reference the task's technical details or acceptance criteria to understand the intended behavior.
