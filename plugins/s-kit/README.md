# s-kit

`s-kit` is a personal agent workflow kit for turning ideas into dated, reviewable specs and then executing those specs through focused implementation Phases.

The core workflow is:

```text
brainstorming -> plan-feature -> build-feature -> verification/review -> ship-it
```

`brainstorming` is the front door. It clarifies the idea, explores options, presents the proposed design for approval, offers `grill-me` as an optional stress-test, and writes the approved solution to `docs/design/YYYY-MM-DD-{feature-name}/design.md`. `plan-feature` expands the approved design into a matching dated spec folder under `docs/specs/YYYY-MM-DD-{feature-name}/`, including a manifest and execution log. `build-feature` reads the spec and matching design, works through task Phases, runs a behavior-preserving simplification pass before spec-compliance and code-quality review gates, and tracks progress in the spec files.

For smaller work, `s-kit` has scale-aware lanes. `quick-change` handles clear, low-risk edits with direct verification and normally skips dated design/spec folders. Bug fixes use `systematic-debugging -> test-driven-development -> verification-before-completion` and also skip dated specs unless the investigation grows into design or architecture work.

For domain-heavy work, `grill-with-docs` can run before or during `brainstorming` to challenge project language and ADR-worthy decisions against `CONTEXT.md`, `docs/adr/`, and existing code. It supports the workflow without replacing the dated design/spec artifacts.

When a design question cannot be settled in conversation, `prototype` can create throwaway runnable evidence before the approved design is written. When the question is about terminology or architecture shape, use `domain-modeling` and `codebase-design` as supporting skills rather than replacing the dated workflow.

## Install Targets

The repo keeps packaging surfaces for:

- Codex App and Codex CLI via `.codex-plugin/`
- Claude Code via `.claude-plugin/`
- GitHub Copilot CLI via `hooks/session-start`
- OpenCode via `.opencode/`
- Cursor via `.cursor-plugin/`
- Gemini via `gemini-extension.json`

## Workflow

1. Use `quick-change` for clear, low-risk edits of roughly 1-3 files when direct verification is available and no design decision is needed.
2. Use `systematic-debugging` for defects, failed commands, failing tests, regressions, or production issues. Pair it with `test-driven-development` and `verification-before-completion`.
3. Use `brainstorming` for any creative, ambiguous, architectural, or broader behavior-changing work.
   - If the idea depends on project-specific language, bounded contexts, or durable architecture decisions, use `grill-with-docs` to sharpen those terms and trade-offs before final design approval.
   - If the idea depends on a runnable answer, use `prototype` to test the question and capture the verdict in the design.
4. After the design is approved, write it to `docs/design/YYYY-MM-DD-{feature-name}/design.md` and use `plan-feature` to create the spec. Offer optional `grill-me` before writing the approved design when the plan needs extra pressure.
5. Designs and specs are created as:

   ```text
   docs/design/YYYY-MM-DD-{feature-name}/
   └── design.md

   docs/specs/YYYY-MM-DD-{feature-name}/
   ├── README.md
   ├── spec.json
   ├── requirements.md
   ├── action-required.md
   ├── implementation-log.md
   └── tasks/
       ├── task-01-{name}.md
       └── task-02-{name}.md
   ```

6. Use `build-feature` to execute a spec Phase by Phase.
7. Use the supporting skills for TDD, debugging, review, verification, worktrees, branch finishing, and skill authoring when they apply.

## Skills

Primary workflow:

- `brainstorming` - collaborative design and approval gate
- `plan-feature` - expands an approved `docs/design/.../design.md` into a matching dated, self-contained feature spec
- `build-feature` - executes feature specs by dependency Phase

Supporting workflow:

- `quick-change` - small scoped changes with direct verification and no dated spec ceremony
- `domain-modeling` - clarifies project terminology, glossary entries, context boundaries, and ADR-worthy domain decisions
- `codebase-design` - shared vocabulary for deep module interfaces, seams, adapters, leverage, and locality
- `prototype` - throwaway runnable experiments for state logic, business rules, interaction flow, or UI direction before implementation
- `grill-me` - optionally stress-tests a design or plan by questioning each decision branch
- `grill-with-docs` - stress-tests plans against project language, `CONTEXT.md`, ADRs, and code before design/spec work locks in terminology
- `test-driven-development` - test-first implementation discipline
- `systematic-debugging` - root-cause debugging process
- `verification-before-completion` - proof before completion claims
- `maintainability-review` - strict maintainability review for branches, PRs, commit ranges, changed files, or recent code-quality work
- `requesting-code-review` - review gate for completed work
- `receiving-code-review` - handles review feedback rigorously
- `ship-it` - platform-aware delivery that pushes committed work and creates or updates GitHub or Azure DevOps pull requests
- `gh-cli` - low-level GitHub CLI reference for explicit GitHub work outside full delivery
- `azure-devops-cli` - low-level Azure DevOps CLI reference for explicit Azure DevOps work outside full delivery
- `using-git-worktrees` - isolated workspace setup when needed
- `finishing-a-development-branch` - delivery and cleanup decisions
- `dispatching-parallel-agents` - general parallel-agent coordination
- `writing-skills` - skill creation and maintenance
- `using-s-kit` - bootstrap/router instructions for skill use

## Agents

The repo also includes a compact first-class agent catalog for runtimes that support reusable agent prompts. These agents are intentionally scoped to the dated design/spec workflow instead of mirroring a larger upstream orchestration system.

- [`s-kit-codebase-mapper`](agents/s-kit-codebase-mapper.md) - maps repository structure, conventions, verification commands, and risks before planning.
- [`s-kit-pattern-mapper`](agents/s-kit-pattern-mapper.md) - finds local implementation patterns that specs and coders should follow.
- [`s-kit-spec-reviewer`](agents/s-kit-spec-reviewer.md) - checks dated specs for coverage, Phase safety, verification quality, and manifest consistency.
- [`s-kit-coder`](agents/s-kit-coder.md) - implements one spec task with scoped file ownership and verification evidence.
- [`s-kit-code-simplifier`](agents/s-kit-code-simplifier.md) - refines recently changed code for clarity while preserving behavior, scope, and verification evidence.
- [`s-kit-code-reviewer`](agents/s-kit-code-reviewer.md) - reviews completed work for spec compliance, correctness, security, maintainability, and tests.
- [`s-kit-fixer`](agents/s-kit-fixer.md) - applies scoped fixes for review findings without widening the task.
- [`s-kit-security-auditor`](agents/s-kit-security-auditor.md) - audits specs or implementation touching secrets, shell commands, packages, files, auth, permissions, or user input.

## Verification

Run `npm test` before publishing changes. It checks the OpenCode plugin syntax, branding/path cleanup, agent catalog integrity, and workflow invariants such as matching `docs/design/` and `docs/specs/` folders, required manifests/logs, task verification plans, task statuses, and same-Phase file ownership.

## Attribution

See [NOTICE.md](NOTICE.md) for upstream attribution.

## License

MIT License - see [LICENSE](LICENSE).
