---
name: start-feature
description: Start a new feature or fix by creating a properly-named git branch (feat/*, fix/*, chore/*, etc.). Use when beginning any new piece of work.
---

# Start Feature

Help the user start a new piece of work by creating a properly-named git branch.

## Steps

1. **Check working tree is clean.** Run `git status --short`. If there are uncommitted changes, warn the user and ask whether to stash, commit, or abort — do not proceed until resolved.

2. **Determine the branch prefix** by asking the user which type of change this is:
   - `feat` — new feature
   - `fix` — bug fix
   - `chore` — maintenance, deps, tooling
   - `docs` — documentation only
   - `refactor` — code restructuring without behaviour change
   - `test` — adding or updating tests

3. **Get a short description** from the user (or infer it if they already stated what the feature is). Convert it to lowercase kebab-case (replace spaces and special characters with hyphens, strip punctuation).

4. **Confirm the branch name** with the user before creating it. Format: `<prefix>/<kebab-description>`. Example: `feat/activity-qr-check-in`.

5. **Create and check out the branch** from the latest `main`:
   ```bash
   git fetch origin main --quiet
   git checkout -b <branch-name> origin/main
   ```
   If `origin` does not exist (local-only repo), branch from local `main` instead.

6. **Confirm success** — show the active branch with `git branch --show-current` and let the user know they're ready to start coding.
