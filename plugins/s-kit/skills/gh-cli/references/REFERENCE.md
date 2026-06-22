# GitHub CLI Reference

## Command Groups

```text
gh auth       # authentication
gh repo       # repositories
gh issue      # issues
gh pr         # pull requests
gh run        # Actions workflow runs
gh workflow   # Actions workflows
gh release    # releases
gh project    # projects
gh api        # REST and GraphQL API calls
gh secret     # Actions secrets
gh variable   # Actions variables
```

## Authentication

```bash
gh auth login
gh auth login --web
gh auth login --with-token < token.txt
gh auth status
gh auth refresh --scopes write:org,read:public_key
gh auth logout
```

Automation environment variables may be used when already configured by the environment. Do not echo or print their values:

```bash
export GH_REPO="{owner}/{repo}"
export GH_PROMPT_DISABLED=true
```

Prefer `gh auth status` to inspect authentication state and `gh auth login` to establish authentication.

## Repositories

```bash
gh repo view
gh repo view {owner}/{repo} --json name,description,defaultBranchRef,url
gh repo clone {owner}/{repo}
gh repo list {owner} --limit 50
gh repo create {name} --private --description "{description}"
gh repo fork {owner}/{repo} --clone
gh repo sync --branch {branch}
```

Use `--repo owner/repo` on commands when the current directory is not the target repository.

## Pull Requests

Use `ship-it` for full delivery workflows that push committed work and create or update pull requests. Use these `gh pr` commands when the user explicitly asks for low-level GitHub CLI PR operations.

```bash
gh pr create --base {base} --head {head} --title "{title}" --body-file {body_file}
gh pr create --fill
gh pr create --draft
gh pr list --state open --json number,title,headRefName
gh pr view {number} --comments
gh pr view {number} --json title,body,state,url,files
gh pr checkout {number}
gh pr diff {number} --name-only
gh pr checks {number}
gh pr checks {number} --watch
gh pr review {number} --request-changes --body "{body}"
gh pr edit {number} --body-file {body_file}
```

Read-only PR inspection can run directly when the target repository and PR are clear. Do not create, edit, approve, request changes, merge, or close unless the user asked for that specific action.

## Issues

```bash
gh issue create --title "{title}" --body "{body}" --label bug
gh issue list --assignee @me --state open
gh issue view {number} --comments
gh issue edit {number} --add-label needs-review
gh issue comment {number} --body "{comment}"
gh issue close {number} --comment "{comment}"
gh issue develop {number} --branch {branch}
```

Do not create, edit, comment on, close, or link issues unless the user asked for that specific action.

## GitHub Actions

```bash
gh run list --limit 20
gh run list --workflow {workflow_file} --branch {branch}
gh run view {run_id}
gh run view {run_id} --log
gh run view {run_id} --job {job_id} --log
gh run watch {run_id}
gh run rerun {run_id}
gh run cancel {run_id}
gh run download {run_id} --dir ./artifacts

gh workflow list
gh workflow view {workflow_file} --yaml
gh workflow run {workflow_file} --ref {branch}
```

Do not rerun, cancel, or dispatch workflows unless the user asked for that specific action.

## Releases

```bash
gh release list
gh release view {tag}
gh release create {tag} --notes-file {notes_file}
gh release create {tag} --draft --prerelease
gh release upload {tag} {asset_path}
gh release download {tag} --dir ./downloads
gh release edit {tag} --notes-file {notes_file}
```

Do not create, upload to, edit, or delete releases unless the user asked for that specific action.

## Projects, Secrets, and Variables

```bash
gh project list --owner {owner}
gh project view {project_number}
gh project item-list {project_number}

gh secret list
gh secret set {name}
gh secret delete {name}

gh variable list
gh variable set {name} "{value}"
gh variable delete {name}
```

Do not read, print, or overwrite secret values unless explicitly requested and safe.

## API and Structured Output

```bash
gh api /user
gh api /repos/{owner}/{repo}
gh api /repos/{owner}/{repo}/issues --method POST --field title="{title}" --field body="{body}"
gh api graphql -f query='{ viewer { login } }'

gh pr list --json number,title,author
gh pr view {number} --json title,body,state --jq '.title'
gh repo view --json owner,name --jq '.owner.login + "/" + .name'
```

Use `--paginate` for endpoints with many results.
