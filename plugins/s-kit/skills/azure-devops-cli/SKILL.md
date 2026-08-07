---
name: azure-devops-cli
description: Use when working with explicit Azure DevOps CLI operations outside full delivery, including az devops, Azure Repos PRs, Azure Pipelines, Azure Boards work items, branch policies, service endpoints, variable groups, or ADO automation. For full delivery requests such as "ship it", "create a PR", "push and PR", or "prepare this for review", use ship-it instead.
---

# Azure DevOps CLI

Use Azure CLI plus the Azure DevOps extension for Azure DevOps Services command-line work. For command detail, read `references/REFERENCE.md`.

Use `ship-it` for full delivery workflows that push committed work and create or update pull requests. This skill stays focused on explicit Azure DevOps CLI operations and command reference work.

## Prerequisites

Check tools and auth before making changes:

```bash
az version
az extension list --query "[?name=='azure-devops'].name" --output tsv
az login
az devops login --organization https://dev.azure.com/{org}
az devops configure --defaults organization=https://dev.azure.com/{org} project={project}
```

If the extension is missing, ask before installing it or run the install only when setup is the requested task:

```bash
az extension add --name azure-devops
```

For automation, prefer `AZURE_DEVOPS_EXT_PAT` over interactive login.

The Azure DevOps CLI extension supports Azure DevOps Services cloud. Do not assume it works with Azure DevOps Server on-prem.

## Detection

In an Azure Repos checkout, prefer `--detect` when the command supports it:

```bash
az repos pr list --detect --output table
```

Use explicit `--org` and `--project` when detection fails or when operating outside the target repository.

## Common Workflows

Create a pull request from the current branch:

```powershell
$sourceBranch = git branch --show-current
$targetBranch = az repos show --detect true --query defaultBranch --output tsv
az repos pr create --source-branch $sourceBranch --target-branch $targetBranch --title "{title}" --description "{description}" --detect --open
```

This is a low-level reference for explicit Azure DevOps PR requests. Use `ship-it` for full delivery.

Pull request inspection:

```bash
az repos pr show --id {pr_id} --output table
```

Run and inspect pipelines:

```bash
az pipelines run --name {pipeline_name} --branch {branch}
az pipelines runs list --pipeline-ids {pipeline_id} --top 5 --output table
az pipelines runs show --run-id {run_id}
```

Query work items:

```bash
az boards query --wiql "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.State] = 'Active'" --output table
az boards work-item show --id {work_item_id}
```

Manage variable groups:

```bash
az pipelines variable-group list --output table
az pipelines variable-group create --name {group_name} --variables key=value
az pipelines variable-group variable create --group-id {group_id} --name {name} --secret true
```

## Output Rules

- Use `--output table` for human-readable summaries.
- Use `--output json` for structured review.
- Use `--output tsv` when assigning one value in shell scripts.
- Use `--query` for JMESPath filtering instead of ad hoc text parsing when JSON is available.

## Safety

- Read-only inspection commands can run directly when the organization, project, and repository are clear.
- State-changing commands such as create, update, complete, abandon, approve, run, cancel, delete, policy, service endpoint, variable, or variable-group operations require clear user intent for that specific action.
- Do not delete projects, repositories, work items, or service endpoints without explicit user approval.
- Confirm organization, project, repository, branch, and PR id before mutating resources.
- Prefer read-only commands first, then perform the requested mutation.
- Do not print PATs, tokens, or secret variable values.
