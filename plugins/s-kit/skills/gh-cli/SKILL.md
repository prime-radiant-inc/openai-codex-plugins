---
name: gh-cli
description: Use when working with explicit GitHub CLI operations outside full delivery, including gh commands, Actions checks or logs, releases, issues, repositories, projects, labels, secrets, variables, or GitHub API automation. For full delivery requests such as "ship it", "create a PR", "push and PR", or "prepare this for review", use ship-it instead.
---

# GitHub CLI

Use `gh` for GitHub command-line work. For command detail, read `references/REFERENCE.md`.

Use `ship-it` for full delivery workflows that push committed work and create or update pull requests. This skill stays focused on explicit `gh` operations and command reference work.

## Prerequisites

Check the CLI and authentication before mutating GitHub state:

```bash
gh --version
gh auth status
```

If auth is missing, stop and ask the user to run:

```bash
gh auth login
```

Do not print tokens or ask the user to paste credentials into chat.

Use `--repo owner/repo` when outside a target repository or when the current directory is ambiguous.

## Common Workflows

Pull request inspection and explicit low-level PR creation:

```bash
gh pr list --author @me
gh pr view {number} --json title,body,state,url
gh pr create --base {base_branch} --head {head_branch} --title "{title}" --body-file {body_file}
gh pr checks {number} --watch
```

Issues:

```bash
gh issue list --assignee @me
gh issue view {number} --comments
gh issue create --title "{title}" --body "{body}" --label bug
gh issue close {number} --comment "{comment}"
```

Actions:

```bash
gh run list --limit 10
gh run view {run_id} --log
gh run watch {run_id}
gh workflow run {workflow_file} --ref {branch}
```

Repositories and releases:

```bash
gh repo view --json name,defaultBranchRef,url
gh repo clone {owner}/{repo}
gh release list
gh release create {tag} --notes-file {notes_file}
```

API:

```bash
gh api /user
gh api /repos/{owner}/{repo}/issues --method POST --field title="{title}"
gh api graphql -f query='{ viewer { login } }'
```

## Output Rules

- Use `--json` and `--jq` for structured extraction.
- Use `--paginate` when listing resources that may exceed one page.
- Use `--web` only when the user wants browser interaction.
- For automation, prefer an existing `GH_TOKEN` environment variable or `gh auth login --with-token`; never echo, print, or store the token.

## Safety

- Read-only inspection commands can run directly when the target repo is clear.
- State-changing commands such as create, edit, review, rerun, cancel, merge, close, delete, release, secret, variable, or repo-setting operations require clear user intent for that specific action.
- Confirm repository, PR or issue number, branch, and target before mutating state.
- Prefer read-only inspection before write operations.
- Do not print tokens, secrets, or private environment values.
