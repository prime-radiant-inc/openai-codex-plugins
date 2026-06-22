---
name: build-feature
description: >
  Orchestrate parallel implementation of a feature specification by dispatching coder agents
  Phase-by-Phase with spec-compliance and code-quality review gates between Phases. Use this
  skill when the user says "implement this feature", "start implementing", "run the spec",
  "execute the plan", "continue implementing", or wants to begin coding a previously planned
  feature from a docs/specs/YYYY-MM-DD-{feature-name}/ folder. Also use when the user says
  "/build-feature" or drags a spec folder into the conversation and asks to implement it.
  This skill does NOT write code itself - it orchestrates coder subagents that work in parallel.
---

# Build Feature

Orchestrate the parallel implementation of a feature specification by dispatching coder agents Phase by Phase. This skill reads a spec folder created by `plan-feature`, uses `spec.json` as the machine-readable contract, dispatches coder agents for each ready task, runs a behavior-preserving simplification pass, runs spec-compliance review before code-quality review, and appends execution evidence to `implementation-log.md`.

The orchestrator never writes code itself when subagents are available. Its job is to:

1. Parse the spec manifest and determine what to do next
2. Give each coder agent exactly the context it needs
3. Verify task output against the approved design and task specs
4. Run a behavior-preserving simplification pass on changed implementation files
5. Verify code quality, integration, security, simplicity, and maintainability
6. Manage the fix loop if either review stage finds issues
7. Track progress in `spec.json`, task files, README checkboxes, and `implementation-log.md`

## Prerequisites

A `docs/specs/YYYY-MM-DD-{feature-name}/` directory containing:

- `README.md` with Phase assignments and task status checkboxes
- `spec.json` with task IDs, Phases, dependencies, file ownership, status values, and verification commands
- `requirements.md` with feature context
- `action-required.md` with manual human actions
- `implementation-log.md` for append-only execution notes
- `tasks/task-{nn}-*.md` files, one self-contained task per implementation unit

The matching approved design must exist at `docs/design/YYYY-MM-DD-{feature-name}/design.md`.

This structure is produced by the `plan-feature` skill. If the user does not have a spec folder, suggest creating one first.

## Status Values

Use these values exactly:

- `pending` - not started
- `in-progress` - currently assigned or being worked
- `blocked` - cannot proceed without user action or an external environment change
- `needs-context` - implementation needs clarification or missing project context
- `done-with-concerns` - implementation completed but review concerns remain
- `review-failed` - a spec or code review failed and fixes are required
- `complete` - accepted after required review and verification

Only `complete` maps to a checked README checkbox. Every other status maps to an unchecked checkbox.

## Orchestration

### Step 1: Load the Spec

1. Resolve the spec folder. Accept either the full dated folder name or an undated feature name.
   - If the full dated folder exists, use it.
   - For undated names, search `docs/specs/*-{feature-name}`.
   - If there are no matches, ask for the spec folder or suggest `plan-feature`.
   - If there is exactly one match, use it.
   - If there are multiple matches, list the candidates and ask the user which one to execute. Do not silently choose the newest match.
2. Derive the matching design path at `docs/design/<resolved-spec-folder-name>/design.md`.
3. Read these files:
   - `<resolved-spec-folder>/spec.json`
   - `<resolved-spec-folder>/README.md`
   - `<resolved-spec-folder>/requirements.md`
   - `<resolved-spec-folder>/action-required.md`
   - `<resolved-spec-folder>/implementation-log.md`
   - `docs/design/<resolved-spec-folder-name>/design.md`
   - `CONTEXT-MAP.md`, relevant `CONTEXT.md` files, and ADRs in `docs/adr/` when present
4. Run the spec preflight:
   - `README.md`, `spec.json`, `requirements.md`, `action-required.md`, `implementation-log.md`, `tasks/`, and the matching design file must exist.
   - `spec.json.designPath` must equal `docs/design/<resolved-spec-folder-name>/design.md`.
   - `spec.json.specPath` must equal `docs/specs/<resolved-spec-folder-name>`.
   - `spec.json.implementationLogPath` must equal `docs/specs/<resolved-spec-folder-name>/implementation-log.md`.
   - `spec.json.allowedTaskStatuses` must contain exactly the status values listed above.
   - The README Design link must point to `../../design/<resolved-spec-folder-name>/design.md`.
   - Every task linked in README must exist under `tasks/`.
   - Every task file under `tasks/` must be linked from README.
   - Every task in `spec.json.tasks[]` must point to an existing task file.
   - Every task file under `tasks/` must be represented in `spec.json.tasks[]`.
   - Every task file must contain `## Status` with one of the allowed status values.
   - Every task file must contain `## Phase` with a positive integer.
   - Every task file must contain `## Verification Plan`, `### RED`, `### GREEN`, and `### Final Verification`.
   - README checkbox state, task file status, and `spec.json.tasks[].status` must agree.
   - Task file IDs must be unique.
   - Tasks in the same Phase must not overlap in `spec.json.tasks[].files.create` or `spec.json.tasks[].files.modify`.
   - Requirements and task files must preserve relevant glossary terms and ADR constraints when context docs exist.
   - If any check fails, stop and report the exact files to fix before dispatching agents.
5. Run a baseline verification before dispatching any Phase: execute the project-level verification commands referenced by the spec (the project-level entries in `spec.json.tasks[].verificationCommands`, or the repository's standard test command). If the baseline fails, report the failing commands and ask the user whether to proceed (failures will be attributed to the pre-existing baseline in `implementation-log.md`) or stop. Record the baseline result in `implementation-log.md` either way.
6. Parse `spec.json.tasks[]` as the source of truth for task IDs, Phases, statuses, dependencies, file ownership, and verification commands.
7. Determine the current Phase: the first Phase that has any task whose status is not `complete`.
8. If all tasks in all Phases are complete, report "All tasks complete!" and stop.

This makes the skill resumable. If invoked on a partially completed spec, it picks up exactly where the manifest says it left off.

### Step 2: Process Each Phase

For each Phase starting from the current one, execute Steps 3 through 9 below, then advance to the next Phase.

Before starting a Phase, append a dated entry to `implementation-log.md` with the Phase number, task IDs, starting statuses, and planned verification commands.

### Step 3: Prepare Phase Tasks

1. Read all incomplete task files for this Phase from the `tasks/` subfolder.
2. Confirm every task dependency in `dependsOn` has status `complete`. If not, mark the task `blocked`, update README/task file/manifest consistently, append the blocker to `implementation-log.md`, and stop.
3. Check for file overlaps from `spec.json.tasks[].files.create` and `spec.json.tasks[].files.modify` across all incomplete tasks in this Phase. If any file appears in more than one task, warn the user:

   ```text
   Warning: File overlap detected in Phase {N}:
   - {file-path} is owned by both task-{nn} and task-{mm}

   Options:
   1. Proceed anyway with conflict risk
   2. Run these tasks sequentially instead of in parallel
   ```

   Wait for the user's decision before proceeding.
4. Update each dispatched task to `in-progress` in `spec.json`, its task file, and README checkbox state. Append the assignment to `implementation-log.md`.

### Step 3A: Phase Risk Preflight

Before dispatching coder agents, create a short, read-only Phase Risk Preflight for the current Phase.

1. Derive the preflight from the approved design, `requirements.md`, current Phase task files, `spec.json` file ownership, completed task summaries, current Phase verification commands, and any loaded context docs or ADRs.
2. Identify likely shared contracts and integration risks for this Phase. Keep the list tied to the Phase's actual files and tasks. Useful categories include:
   - Public exports and compatibility entrypoints.
   - Browser/Node or platform-specific substitutions.
   - Runtime side effects at module import time.
   - Timers, handles, cleanup, and process lifetime behavior.
   - Generated artifacts and package metadata.
   - Cross-task shared types, constructors, schemas, or configuration.
   - Auth, filesystem, shell, network, privacy, or security-sensitive boundaries.
   - Verification commands that should be grouped because one command only proves part of the boundary.
   - Glossary terms, avoided synonyms, context boundaries, or ADR constraints that review and fix agents must preserve.
3. Flag the Phase as security-sensitive when its owned files touch secrets or credentials, shell command construction, package installs, filesystem writes or deletes, auth or permissions, network calls, or user-controlled input. Record the flag in the preflight summary.
4. The preflight is not a review verdict. It is a short list of contracts and risks that review and fix agents must account for during this Phase.
5. Append the preflight summary to `implementation-log.md` before coder dispatch.
6. Pass the same Phase Risk Preflight text into spec-compliance review, code-quality review, and fix prompts. Coder and simplifier prompts do not receive the preflight. Quote any preflight line that directly affects a task inside that Phase's Design Digest (coder) or that task's entry in **{task_summaries}** (simplifier); the simplifier also holds the full design.

### Step 4: Dispatch Coder Agents

#### Host Adapter

Before dispatching, choose the host adapter:

| Host | Coder dispatch | Simplifier dispatch | Review dispatch |
|------|----------------|---------------------|-----------------|
| Claude Code | `Task` tool with the strongest available coding/general agent | `Task` tool with `s-kit-code-simplifier` when available, otherwise the simplifier prompt | `Task` tool with a review-focused prompt |
| Copilot CLI | `task` with `agent_type: "general-purpose"` unless a coding-specific type exists | `task` with `agent_type: "general-purpose"` and the simplifier prompt | `task` with `agent_type: "general-purpose"` and the review prompt |
| Codex with multi-agent enabled | `spawn_agent` for each coder prompt, then wait for all spawned agents | `spawn_agent` once with the simplifier prompt | `spawn_agent` once with the review prompt |
| No subagent tool | Report the limitation and ask whether to execute the Phase sequentially in the current session | Run the simplification pass sequentially only if the user chose current-session execution | Report the limitation and ask whether to execute the Phase sequentially in the current session |

For each incomplete task in the Phase, dispatch one coder agent using the selected host adapter. Dispatch all coder agents for the Phase in a single message when the host supports parallel execution.

Read `references/coder-prompt-template.md` and construct each agent's prompt by filling in:

- **{design_digest}**: a 10-20 line digest of the approved design, requirements, and domain context scoped to this Phase: shared contracts (public exports, types, schemas), glossary terms, ADR constraints, naming and error-handling conventions, and any Phase Risk Preflight lines that directly affect the task. Reviewers hold the full design and context docs; the digest is working context, not the contract of record.
- **{spec_manifest}**: the relevant `spec.json` task entry and global paths/status rules
- **{completed_tasks_summary}**: one line per completed task stating what was built and what files were created/modified
- **{task_content}**: full text of the task file being assigned

The coder agents should not commit their changes.

### Step 5: Collect Results

Wait for all coder agents in the Phase to complete. Each agent should report:

- Files created
- Files modified
- Verification commands run, with results
- A summary of what was implemented
- Final task status recommendation: `complete`, `blocked`, `needs-context`, or `done-with-concerns`
- Any concerns, skipped checks, or follow-up needed

If any agent fails, returns an error, or reports missing context, set that task to `needs-context` or `blocked` as appropriate, update spec files consistently, append the outcome to `implementation-log.md`, and continue collecting remaining results. Report unresolved failures before review.

### Step 5A: Simplification Pass

After coder or fix agents complete and before review, run one behavior-preserving simplification pass for the current Phase.

1. Build the changed-file scope from the latest coder or fix completion reports and the current Phase's `spec.json.tasks[].files.create` and `spec.json.tasks[].files.modify` entries. Restrict the simplifier to this set. If an agent reports no changed files, use that task's manifest file ownership as the fallback scope.
2. Dispatch one simplifier agent using the selected host adapter. Prefer the named `s-kit-code-simplifier` agent when the host supports bundled agents. Otherwise, read `references/simplifier-prompt-template.md` and construct the prompt by filling in:
   - **{phase_number}**: current Phase number
   - **{requirements}**: full text of `requirements.md`
   - **{design}**: full text of the matching `docs/design/YYYY-MM-DD-{feature-name}/design.md`
   - **{task_summaries}**: for each task in this Phase, the task title, manifest entry, task file content, files created/modified, verification evidence, and coder or fixer completion summary; completed-task context from earlier Phases is one line per task
   - **{changed_files}**: the exact changed-file scope for this Phase
   - **{verification_commands}**: the targeted commands from `spec.json.tasks[].verificationCommands` plus any affected project-level lint, typecheck, or test commands
3. The simplifier may edit only files in the changed-file scope and may return `no-op` when the implementation is already clear. It must preserve behavior, avoid unrelated fixes, respect the contracts in the approved design and task summaries, and rerun relevant verification after edits.
4. A `no-op` result must include Final Verification command output for each task in scope. A `no-op` without verification evidence sets the affected tasks to `done-with-concerns` instead of allowing `complete`.
5. Collect the simplifier result and append its status, files modified, simplifications, verification evidence, and concerns to `implementation-log.md`.
6. Include the coder or fixer completion summary, simplifier summary, and simplifier verification evidence in the task summaries passed to later review agents.
7. If the simplifier reports `blocked`, fails verification, changes behavior, or edits outside the changed-file scope, set the affected tasks to `review-failed`, append the details to `implementation-log.md`, and go to Step 7.

### Step 6A: Spec Compliance Review

Before dispatching any review agent, build a concrete review scope from the latest coder or fixer completion reports, the simplifier result, the current Phase's changed-file scope, and the current Phase's `spec.json.tasks[].files.create` and `spec.json.tasks[].files.modify` entries. Prefer a git range or task diff when one is already known; otherwise pass the exact file set reviewed. If no concrete git range, task diff, or file set can be identified, stop and request that scope instead of asking the reviewer to discover the whole repository.

Review agents are read-only. Do not ask them to modify files, the index, HEAD, branch state, staged changes, task statuses, or generated artifacts. Historical comparison is allowed only through read-only git commands or a separate temporary worktree.

Dispatch a single review agent using the selected host adapter.

Read `references/review-prompt-template.md` and construct the prompt with **{review_type}** set to `Spec Compliance`. Fill in:

- **{read_only_contract}**: the Contract section of `references/read-only-review-contract.md`, pasted verbatim
- **{phase_number}**: current Phase number
- **{requirements}**: full text of `requirements.md`
- **{design}**: full text of the matching `docs/design/YYYY-MM-DD-{feature-name}/design.md`
- **{phase_risk_preflight}**: the Phase Risk Preflight for the current Phase
- **{task_summaries}**: for each task in this Phase, the task title, manifest entry, the task file's Acceptance Criteria and Verification Plan sections (not the full task file), files created/modified, verification evidence, coder or fixer completion summary, and simplifier summary and verification evidence; completed tasks from earlier Phases are one line each
- **{review_scope}**: the concrete git range, task diff, or exact file set the reviewer must inspect
- **{verification_commands}**: the targeted commands from `spec.json.tasks[].verificationCommands`

The review agent should verify:

1. The implementation matches the approved design.
2. Each task meets its Technical Details, Verification Plan, and Acceptance Criteria.
3. Each task stayed within scope and did not add unrelated behavior.
4. Manual action assumptions match `action-required.md`.
5. The manifest, task file status, and README checkbox updates are consistent.
6. The simplification pass stayed within the changed-file scope and did not alter approved behavior.
7. Glossary terms, avoided synonyms, and ADR constraints from the approved spec context are preserved.

Return a structured verdict: **PASS** or **FAIL** with the git range, task diff, or file set reviewed and specific issues grouped by task.

If this review fails, do not run code-quality review yet. Set affected tasks to `review-failed`, append the verdict to `implementation-log.md`, and go to Step 7.

### Step 6B: Code Quality Review

Run this only after simplification and spec-compliance review pass.

Dispatch a single review agent using the selected host adapter and the same `references/review-prompt-template.md`, with **{review_type}** set to `Code Quality`. Fill in the same placeholders as Step 6A, including the pasted **{read_only_contract}**.

Use the same concrete **{review_scope}** unless code-quality review needs a narrower task diff or file set; if it does, state that narrowed scope explicitly in the prompt.

If the Phase was flagged security-sensitive in the Phase Risk Preflight, also dispatch the `s-kit-security-auditor` agent (read-only) in parallel with the code-quality review, scoped to the same concrete review scope. Treat a `CHANGES REQUESTED` audit verdict exactly like a code-quality review **FAIL**: set affected tasks to `review-failed`, append the findings to `implementation-log.md`, and go to Step 7.

The review agent should:

1. Run the listed verification commands and report results. Fix nothing.
2. Check integration across task outputs: imports, types, module boundaries, configuration, environment assumptions, and generated artifacts.
3. Check maintainability, simplicity, security, performance, error handling, and adherence to project conventions.
4. Check that no hidden branding/path cleanup regressions or workflow invariant regressions were introduced when the repo has those checks.
5. Check that naming and abstractions do not drift away from `CONTEXT.md` glossary terms or contradict accepted ADRs.

Return a structured verdict: **PASS** or **FAIL** with specific issues grouped by task.

If this review fails, set affected tasks to `review-failed`, append the verdict to `implementation-log.md`, and go to Step 7.

### Step 7: Fix Loop

If Step 5A fails or either review returns **FAIL**:

1. Parse the issues from the simplifier result or review: source, file paths, descriptions, severity, and suggested fixes.
2. Check whether this Phase has failed review more than once in the same boundary after at least one fix attempt. Treat failures as the same boundary when they share the same files, public contract, runtime behavior, package/config mapping, generated artifact, or cross-task integration point.
3. If repeated same-boundary failure is detected, request a complete punch-list review for that boundary before dispatching another narrow fix. The punch-list review is read-only, uses the concrete boundary scope plus the Phase Risk Preflight, and must return all blocking issues it can find in that boundary. Append the complete punch-list verdict to `implementation-log.md`.
4. Group issues by the task they most closely relate to, using `spec.json.tasks[].files.create` and `spec.json.tasks[].files.modify`. When complete punch-list mode was used, group every issue from the punch list before dispatching fix agents.
5. For each group, dispatch a coder agent with a fix prompt. Read `references/fix-prompt-template.md` and fill in:
   - **{issues}**: the specific issues for this task group, including whether they came from simplification, spec-compliance review, or code-quality review
   - **{phase_risk_preflight}**: the Phase Risk Preflight for the current Phase
   - **{boundary_context}**: the Boundary Context for the same-boundary or complete punch-list review, or "None" for a normal first-pass fix
   - **{task_content}**: the original task file for context
6. After fix agents complete, append the fix result to `implementation-log.md`.
7. Re-run Step 5A, then Step 6A. Only run Step 6B after Step 5A and Step 6A pass.

Cap at 3 simplification/review cycles per Phase. If the third cycle still fails, stop and report to the user:

```text
Phase {N} review failed after 3 cycles. Outstanding issues:
{list of remaining issues}

Options:
1. Fix these manually and re-run /build-feature
2. Proceed to the next Phase anyway
3. Stop here
```

### Step 8: Complete the Phase

After both reviews pass, or the user explicitly chooses to proceed:

1. Update task files: for each accepted task, change the Status field to `complete`; if proceeding with concerns, use `done-with-concerns`.
2. Update `spec.json.tasks[].status` to match each task file.
3. Update `README.md` checkboxes: `[x]` only for `complete`; `[ ]` for all other statuses.
4. Append the simplification result, spec-compliance verdict, code-quality verdict, verification evidence, and final task statuses to `implementation-log.md`.
5. Commit policy: do not commit if the user asked not to commit. Otherwise, follow the repository's delivery instructions for commits.
6. Report Phase completion:

   ```text
   Phase {N} of {total} complete.

   Tasks completed:
   - task-{nn}-{name}: {one-line summary}
   - task-{mm}-{name}: {one-line summary}

   Spec compliance review: PASS
   Simplification: {status}
   Code quality review: PASS
   Commit: {hash or "not committed by request"}

   Next: Phase {N+1} has {count} tasks ready for parallel execution.
   ```

### Step 9: Final Integration Review

After all Phases are complete:

1. Run project-level verification one final time.
2. Build the full feature scope as a git range or exact file set from the accepted task diffs.
3. Dispatch one code-quality review agent for that scope. Do not dispatch a full-feature spec-compliance review: the per-Phase spec-compliance verdicts recorded in `implementation-log.md` are the compliance record. Do not re-inject all task summaries; the review receives the scope, the design, the requirements, and the verification commands. Use `references/review-prompt-template.md` with **{review_type}** = `Code Quality` and **{phase_number}** = `final`, pasting **{read_only_contract}** as in Step 6A. Fill **{task_summaries}** with a one-line-per-task roll-up of all completed tasks, and set **{phase_risk_preflight}** to `None — final integration review` (per-Phase preflights are already in the log).
4. Append final verification commands, review verdicts, and any residual concerns to `implementation-log.md`.
5. Report the final status:

```text
Feature "{feature}" implementation complete.

Phases completed: {N}/{N}
Total tasks: {T}

Verification:
- Project verification: {PASS/FAIL}
- Per-Phase spec compliance verdicts: {all PASS / list exceptions}
- Full code quality review: {PASS/FAIL with notes}

Next steps:
- Review the changes
- Push and create a PR when ready
```

## Error Handling

- **Coder agent failure**: mark the task as `needs-context`, `blocked`, or `review-failed` depending on the failure. Report to the user and append the event to `implementation-log.md`.
- **Dependency not complete**: mark the dependent task as `blocked`, report the missing dependency, and stop before dispatching the Phase.
- **Verification failure after fix attempts**: report the specific errors and ask the user whether to commit anyway or fix manually.
- **All tasks already complete**: report completion and stop.
- **Missing spec folder**: ask the user to provide the feature name or suggest creating a spec with `plan-feature`.
- **Ambiguous undated spec name**: list all matching dated spec folders and ask the user to choose one.
- **Preflight failure**: report the failing invariant and stop before dispatching agents.
- **Reopened completed task**: if a `complete` task is reopened (set back to `in-progress`, `needs-context`, or `review-failed`), revert every transitive dependent task to `blocked`, update `spec.json`, task files, and README checkboxes consistently, and append a dated entry to `implementation-log.md` stating the reason before any re-dispatch.

## Key Principles

- **The orchestrator does not write code when subagents are available.** Its job is dispatch, review, and progress tracking. If the current environment has no subagent tool, report that limitation and execute tasks sequentially in the current session only when the user explicitly asks to continue.
- **`spec.json` is the orchestration contract.** README checkboxes and task file status fields mirror it.
- **Each coder agent gets exactly one task.** This keeps each agent's context focused and manageable.
- **Completed task summaries are brief.** One line per task, not the full file contents. This keeps coder agent prompts from growing unbounded as Phases progress.
- **Coders build from self-contained task files plus a design digest; reviewers hold the full design.** Review is the contract of record.
- **Review is two-stage.** Spec compliance catches "built the wrong thing" before code-quality review spends time on implementation quality.
- **Progress is append-only in `implementation-log.md`.** The log records what happened, what was verified, what failed, and what was accepted.
