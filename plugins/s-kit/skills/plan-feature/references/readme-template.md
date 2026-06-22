# README Template

Use this structure for the README.md at the root of each spec folder. The README serves as the orchestration index — the `build-feature` skill reads it to determine Phase order, task assignments, and completion status.

## Template

```markdown
# {Feature Name}

## Overview

{One paragraph summary of what the feature does and why it exists.}

## Quick Links

- [Requirements](./requirements.md) — full requirements and acceptance criteria
- [Design](../../design/{feature-folder-name}/design.md) — approved solution shape and decisions
- [Action Required](./action-required.md) — manual steps needing human action
- [Manifest](./spec.json) — machine-readable orchestration contract
- [Implementation Log](./implementation-log.md) — append-only execution and review record

## Dependency Graph

​```mermaid
graph TD
    task-01-name["01: Task Title"]
    task-02-name["02: Task Title"]
    task-03-name["03: Task Title"]
    task-01-name --> task-03-name
    task-02-name --> task-03-name
​```

## Phases

| Phase | Tasks | Description |
|------|-------|-------------|
| 1 | task-01, task-02 | {Brief description of what this Phase accomplishes} |
| 2 | task-03 | {Brief description} |

## Task Status

### Phase 1
- [ ] [task-01-{name}](./tasks/task-01-{name}.md) — {One-line title}
- [ ] [task-02-{name}](./tasks/task-02-{name}.md) — {One-line title}

### Phase 2
- [ ] [task-03-{name}](./tasks/task-03-{name}.md) — {One-line title}
```

## Key Points

- The **Dependency Graph** uses Mermaid syntax (widely rendered in GitHub, VS Code, etc.). Each node shows the task number and title for quick reference.
- The **Phases** table provides a scannable overview of what runs in parallel.
- The **Task Status** section uses markdown checkboxes that the `build-feature` skill updates as tasks complete. The orchestrator parses these to determine which Phase to resume from.
- The **Manifest** link points to `spec.json`, which owns task IDs, Phases, statuses, file ownership, dependencies, and verification commands.
- The **Implementation Log** link points to `implementation-log.md`, which records Phase starts, task results, review verdicts, verification evidence, blockers, and final integration notes.
- Use the exact dated design/spec folder name for `{feature-folder-name}`.
- Links to task files use relative paths pointing into the `tasks/` subfolder.
- Tasks without dependencies have no incoming arrows in the graph — these form Phase 1.
