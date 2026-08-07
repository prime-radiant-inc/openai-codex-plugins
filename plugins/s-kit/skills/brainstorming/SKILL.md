---
name: brainstorming
description: "Use before creative or behavior-changing work. Clarifies intent, explores options, presents a design for approval, then hands off to plan-feature."
---

# Brainstorming Ideas Into Designs

Use this skill to turn a rough idea into an approved design before implementation starts.

<HARD-GATE>
Do not invoke implementation skills, write code, scaffold projects, or make behavior changes until you have presented a design and the user has approved it.
</HARD-GATE>

## Checklist

Complete these in order:

1. Explore project context: files, docs, recent commits, and relevant specs.
2. Offer the visual companion if upcoming questions would be easier with mockups or diagrams.
3. Ask clarifying questions one at a time.
4. Propose 2-3 approaches with trade-offs and a recommendation.
5. If conversation cannot settle a design question, use `prototype` to answer it with throwaway runnable evidence, then carry the verdict back into the design.
6. Present the design in sections and get user approval.
7. Offer `grill-me` as an optional stress-test before writing the approved design. This is optional; do not block normal approval if the user declines.
8. Choose the dated feature folder name and write the approved design to `docs/design/YYYY-MM-DD-{feature-name}/design.md` using the structure in `references/design-template.md`.
9. Hand off to `plan-feature` with that exact design path so it can expand the design into requirements, manifest, execution log, orchestration, and task files under the matching `docs/specs/YYYY-MM-DD-{feature-name}/` folder.
10. Ask the user to review the written spec before implementation with `build-feature`.

## Process

Start with the current project state. If the request is too broad for one spec, decompose it and brainstorm the first independently shippable piece.

If the request matches a small lane in `using-s-kit` (bug fix, refactor/docs, or hotfix), say so and route to that lane instead of starting a design. Brainstorming is for work that needs design decisions.

For an unfamiliar or large repository, offer to dispatch the `s-kit-codebase-mapper` agent first. It returns an evidence-backed map (architecture, conventions, relevant files, risks) that grounds the clarifying questions and design. This is optional; skip it when the project is already well understood.

If a question needs runnable evidence, route through `prototype` before approval. Use it for state machines, business rules, interaction flow, or UI direction where talking through the design would leave uncertainty. Prototype output is not production code; capture only the verdict and decision in `design.md`.

Ask one question per message. Prefer multiple choice when it makes the decision easier. Focus on purpose, constraints, success criteria, dependencies, and what should be explicitly out of scope.

When you understand the work, propose approaches. Lead with the recommended approach and explain why. Keep the trade-offs practical: implementation effort, risk, future flexibility, and how well the approach fits the repo.

Present the design after the approach is selected. Scale the depth to the work. Cover architecture, components, data flow, error handling, verification, and rollout where relevant.

After approval, write `design.md` first, then invoke `plan-feature`. Offer `grill-me` as an optional stress-test before writing the approved design if the user wants deeper review. `brainstorming` owns the dated folder name. `plan-feature` must reuse that same folder name for the spec.

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

`design.md` is the direct output of brainstorming. Follow `references/design-template.md`. It should capture the approved solution shape: context, selected approach, alternatives considered, architecture, major decisions, open risks, and verification strategy. `grill-me` can be offered before the file is written to stress-test the proposed design, but it is optional. `plan-feature` uses the approved design as the source material for `requirements.md`, `README.md`, `spec.json`, `implementation-log.md`, and task files. After the spec is reviewed, `build-feature` executes it Phase by Phase.

## Visual Companion

If visual questions are likely, offer this exact message by itself:

> Some of what we're working on might be easier to explain if I can show it to you in a web browser. I can put together mockups, diagrams, comparisons, and other visuals as we go. This feature is still new and can be token-intensive. Want to try it? (Requires opening a local URL)

Wait for the user's response. If accepted, use visuals only for questions that are genuinely clearer when seen rather than read.
