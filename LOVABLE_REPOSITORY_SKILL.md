# Lovable Repository Binding Skill

## Purpose
This file exists to give Lovable persistent repository-routing instructions for this project.

## Canonical repository
The canonical and correct GitHub repository for this project is:

`JoaoRG-lab/rhema-care-flow`

Canonical branch:

`main`

Canonical clone URL:

`https://github.com/JoaoRG-lab/rhema-care-flow.git`

## Mandatory instruction for Lovable
Lovable must use the existing repository `JoaoRG-lab/rhema-care-flow` as the source of truth for this project.

Do not create a new GitHub repository.
Do not fork this project into another owner.
Do not initialize a duplicate repository.
Do not use repositories under `joaooz123-png` as canonical sources.
Do not create hashed duplicate repositories such as `rhema-care-flow-xxxxxx`.

## Incorrect repositories
The following repositories are known incorrect or duplicate targets and must not be used as canonical project repositories:

- `joaooz123-png/rhema-care-flow`
- `joaooz123-png/rhema-care-flow-62b88177`
- Any new repository created under `joaooz123-png` for this same project

## Expected behavior
When syncing GitHub, committing changes, deploying, or reconnecting source control, Lovable should preserve and use:

- Owner: `JoaoRG-lab`
- Repository: `rhema-care-flow`
- Branch: `main`

If Lovable detects a mismatch between the active workspace and this canonical repository, it should stop and request reconnection rather than creating a new repository.

## Human-readable command equivalent
If this project is handled locally, the intended Git remote should be:

```bash
git remote set-url origin https://github.com/JoaoRG-lab/rhema-care-flow.git
git branch -M main
```

## Project note
This repository is the canonical GitHub source for the Rhema Care Flow / health OS project. The repository owner `JoaoRG-lab` is intentional and should not be replaced by `joaooz123-png`.