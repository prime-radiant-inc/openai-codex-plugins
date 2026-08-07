# Design Template

Use this structure for `docs/design/YYYY-MM-DD-{feature-name}/design.md`. This file is the direct output of `brainstorming` and records the human-approved solution shape before task decomposition.

## Template

```markdown
# Design: {Feature Name}

## Context

{What prompted this work, who it is for, and what problem it solves.}

## Approved Approach

{The selected solution and why it was chosen.}

## Alternatives Considered

- {Alternative 1} — {why it was not selected}
- {Alternative 2} — {why it was not selected}

## Architecture

{Major components, boundaries, data flow, ownership, and integration points.}

## Configuration and Inputs

{Stored configuration, command arguments, defaults, per-command overrides, secrets, and validation rules. Be explicit about which values are persisted and which are supplied each run.}

## Decisions

- {Decision 1}
- {Decision 2}

## Risks and Constraints

- {Risk or constraint 1}
- {Risk or constraint 2}

## Verification Strategy

{How implementation will be proven correct: tests, scans, runtime checks, review gates, or manual checks.}
```

## Key Points

- `design.md` is approved before implementation work starts.
- `brainstorming` owns the dated design folder name.
- `plan-feature` derives `requirements.md`, the orchestration `README.md`, `spec.json`, `implementation-log.md`, and task files from this design.
- Distinguish stored configuration, command arguments, defaults, and per-command overrides.
- Keep it focused on solution shape and decisions. Implementation minutiae belongs in task files.
