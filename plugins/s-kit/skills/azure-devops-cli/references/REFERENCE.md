# Azure DevOps CLI Reference

## Command Groups

```text
az devops      # organization, project, team, user, extension, login
az repos       # repositories, pull requests, refs, policies
az pipelines   # pipelines, runs, builds, variables, variable groups
az boards      # work item queries and updates
az artifacts   # universal packages
```

## Authentication

```bash
az login
az devops login --organization https://dev.azure.com/{org}
az devops configure --defaults organization=https://dev.azure.com/{org} project={project}
az devops configure --list
```

For non-interactive sessions:

```powershell
$env:AZURE_DEVOPS_EXT_PAT = "{pat}"
```

Do not echo or print PATs, tokens, or secret variable values.

## Extension Setup

Check for the Azure DevOps extension before adding it:

```powershell
az extension list --query "[?name=='azure-devops'].name" --output tsv
```

If the extension is missing, install it only when setup is the requested task:

```powershell
az extension add --name azure-devops
```

## Pull Requests

Use `ship-it` for full delivery workflows that push committed work and create or update pull requests. Use `az repos pr create` when the user explicitly asks for low-level Azure DevOps PR creation.

```powershell
$sourceBranch = git branch --show-current
$targetBranch = az repos show --detect true --query defaultBranch --output tsv
az repos pr create --repository {repo} --source-branch $sourceBranch --target-branch $targetBranch --title "{title}" --description "{body}"
az repos pr list --repository {repo} --status active --output table
az repos pr show --id {pr_id}
az repos pr reviewer add --id {pr_id} --reviewers user@example.com
az repos pr work-item add --id {pr_id} --work-items {id1} {id2}
```

Read-only PR inspection can run directly when the target is clear. Do not create, update, complete, abandon, vote, add reviewers, or link work items unless the user asked for that specific action.

## Pipelines

```bash
az pipelines list --output table
az pipelines create --name {name} --repository {repo} --branch {target_branch} --yaml-path azure-pipelines.yml
az pipelines run --name {name} --branch {branch}
az pipelines run --name {name} --parameters key=value
az pipelines runs list --pipeline {pipeline_id} --top 10 --output table
az pipelines runs show --run-id {run_id}
az pipelines runs artifact download --run-id {run_id} --artifact-name {artifact} --path {path}
```

## Builds

```bash
az pipelines build list --status completed --result succeeded
az pipelines build queue --definition {definition_id} --branch {branch}
az pipelines build show --id {build_id}
az pipelines build cancel --id {build_id}
az pipelines build tag add --build-id {build_id} --tags prod release
```

## Variables and Variable Groups

```bash
az pipelines variable list --pipeline-id {pipeline_id}
az pipelines variable create --pipeline-id {pipeline_id} --name {name} --value {value}
az pipelines variable create --pipeline-id {pipeline_id} --name {name} --secret true
az pipelines variable update --pipeline-id {pipeline_id} --name {name} --value {value}
az pipelines variable delete --pipeline-id {pipeline_id} --name {name} --yes

az pipelines variable-group list --output table
az pipelines variable-group show --id {group_id}
az pipelines variable-group create --name {name} --variables key=value --authorize true
az pipelines variable-group variable create --group-id {group_id} --name {name} --value {value}
az pipelines variable-group variable create --group-id {group_id} --name {name} --secret true
```

## Work Items

```bash
az boards query --wiql "SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.State] = 'Active'"
az boards work-item show --id {id}
az boards work-item create --title "{title}" --type Bug --description "{description}"
az boards work-item update --id {id} --state Active
az boards work-item update --id {id} --discussion "{comment}"
```

Do not delete or destroy work items without explicit approval.

## Repositories and Policies

```bash
az repos list --output table
az repos show --repository {repo}
az repos create --name {repo}
az repos ref list --repository {repo}

az repos policy approver-count create --blocking true --enabled true --branch {target_branch} --repository-id {repo_id} --minimum-approver-count 2
az repos policy build create --blocking true --enabled true --branch {target_branch} --repository-id {repo_id} --build-definition-id {definition_id}
az repos policy work-item-linking create --blocking true --enabled true --branch {target_branch} --repository-id {repo_id}
```

Do not create repositories or branch policies unless the user asked for that specific action.

## Output and Queries

```bash
az pipelines list --output table
az pipelines list --output json
az pipelines list --output tsv
az pipelines list --query "[].{Name:name, ID:id}" --output table
az pipelines list --query "[?name=='{name}'].id" --output tsv
```

Prefer JMESPath queries over brittle text parsing.
