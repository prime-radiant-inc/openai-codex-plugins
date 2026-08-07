---
name: ship-it
description: Use when the user says "ship it", "/ship-it", "ship this", "create a PR", "open a pull request", "push and PR", "send this for review", "prepare this for review", "write the PR description and open it", or asks to push committed work and create or update a GitHub or Azure DevOps pull request.
---

# Ship It

Deliver committed work for pull request review. This skill verifies a clean worktree, detects the hosting platform and target branch, generates the PR title and body from commits and diffs, pushes the current branch when needed, then creates, updates, or reports the pull request.

Do not commit, run quality gates, rewrite history, print or persist tokens, or merge, complete, approve, abandon, or close PRs unless the user explicitly asks.

## Workflow

### 1. Gate on a Clean Worktree

Inspect repository state before any remote mutation:

```bash
git status --short
git branch --show-current
git remote -v
```

If there are staged, unstaged, or untracked changes, stop. Report the changed files and ask whether to run the commit workflow or receive explicit instructions. Do not push or create/update a PR from a dirty worktree.

### 2. Detect the Platform

Use the remote URL and platform CLIs:

- **GitHub:** remote host is GitHub or `gh repo view` succeeds.
- **Azure DevOps:** remote contains `dev.azure.com` or `visualstudio.com`, or Azure Repos detection succeeds.
- **Unknown:** stop before push or PR mutation and ask the user for the target platform.

Verify the chosen CLI and auth only after platform detection.

GitHub:

```bash
gh --version
gh auth status
```

Azure DevOps:

```bash
az --version
az devops configure --list
az repos show --detect true
```

If the CLI is missing or unauthenticated, stop and tell the user exactly what setup is needed. Do not print tokens; if a PAT is required, direct the user to authenticate through the CLI.

### 3. Detect the Target Branch

Use an explicit user-provided target branch when present. Otherwise detect it dynamically; do not hardcode `main` or `master`.

GitHub:

```bash
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
```

Azure DevOps:

```bash
az repos show --detect true --query defaultBranch --output tsv
```

If platform metadata is unavailable, inspect the remote:

```bash
git remote show origin
```

If the target branch is still unknown, stop and ask the user for it before pushing or creating/updating a PR.

### 4. Inspect Commits and Diff

Fetch remote refs first:

```bash
git fetch origin
```

If the branch has an upstream, compare against it:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{upstream}
git log @{upstream}..HEAD --oneline
```

Also compare against the target branch for PR content:

```bash
git log origin/{target_branch}..HEAD --oneline
git diff origin/{target_branch}...HEAD --stat
git diff origin/{target_branch}...HEAD --name-only
```

Use the commit subjects, diff stat, and changed file list to draft:

- A conventional PR title: `type: concise imperative summary`.
- A PR description with `## Summary`, `## Changes`, and, when relevant, `## Related Work Items`, `## Verification`, and `## Risks & Considerations`.

Keep small PRs small. Base the PR description on the actual commit range and diff, not memory. Include changed files, commit summaries, tests run when known from commits or user-provided context, and review notes or risks.

### 5. Ensure a Review Branch

If already on a non-target branch, keep using it.

If on the target branch with commits to ship, create a short branch name from the commit subjects:

```bash
git switch -c {type}/{short-kebab-summary}
```

Use conventional prefixes such as `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `test/`, `build/`, or `ci/`.

### 6. Find Existing PR

Check for an existing open PR before creating a new one.

GitHub:

```bash
gh pr view --json number,url,title,state,headRefName,baseRefName
```

Azure DevOps:

```bash
az repos pr list --source-branch {branch_name} --status active --query "[0].{pullRequestId:pullRequestId,title:title,url:url,targetRefName:targetRefName}"
```

If an existing open PR is found, update its title/body when the user asked for refreshed PR content or the generated content has changed; otherwise report it. Do not create a duplicate PR.

### 7. Push When Needed

Determine whether the branch has an upstream and whether local commits need pushing:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{upstream}
git log @{upstream}..HEAD --oneline
```

If there is no upstream, push with upstream:

```bash
git push -u origin {branch_name}
```

If there is an upstream and unpushed commits exist, push:

```bash
git push
```

If the branch is already pushed and has no open PR, still create the PR. "No unpushed commits" is not "nothing to ship" when no PR exists.

Never use `--force`, `--force-with-lease`, `reset --hard`, or any destructive git operation.

### 8. Create or Update the PR

Write the generated body to a temporary file to avoid shell quoting problems, then remove it after a successful create/update:

```bash
mkdir -p .github/.tmp
```

PowerShell:

```powershell
New-Item -ItemType Directory -Force .github/.tmp
```

GitHub create:

```bash
gh pr create --base {target_branch} --head {branch_name} --title "{title}" --body-file .github/.tmp/pr-description.md
```

GitHub update:

```bash
gh pr edit {pr_number} --title "{title}" --body-file .github/.tmp/pr-description.md
```

Azure DevOps create:

```bash
az repos pr create --title "{title}" --description "{body}" --source-branch "{branch_name}" --target-branch "{target_branch}"
```

Azure DevOps update:

```bash
az repos pr update --id {pr_id} --title "{title}" --description "{body}"
```

Azure work items can be referenced as `AB#12345` in the body or linked with `--work-items` when explicitly requested.

## Report Format

Report the result with:

```text
Shipped to {platform}
Branch: {branch_name}
Target branch: {target_branch}
PR: {number_or_id} - {title}
URL: {url}
```

## Rules

- Do not commit changes.
- Do not run lint, tests, type-checks, or builds unless the user explicitly asks.
- Do not create duplicate PRs.
- Detect the platform and target branch dynamically.
- Stop on uncommitted changes instead of silently broadening scope.
- Ask before remote mutation when the platform or target branch is unknown.
- Use `gh-cli` and `azure-devops-cli` as lower-level command references when more command detail is needed.
- Do not merge, complete, approve, abandon, or close PRs unless the user explicitly asks.
