#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-huji-leon}"
BACKEND_ID="${BACKEND_ID:-ccms}"
COMMIT="${1:-$(git rev-parse HEAD)}"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree has uncommitted changes."
  echo "Firebase App Hosting deploys Git commits, so commit and push first."
  exit 1
fi

git fetch --quiet
UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
if [[ -n "$UPSTREAM" ]] && ! git merge-base --is-ancestor "$COMMIT" "$UPSTREAM"; then
  echo "Commit $COMMIT is not pushed to $UPSTREAM."
  echo "Push first, then rerun this deploy."
  exit 1
fi

echo "Deploying App Hosting backend '$BACKEND_ID' from commit $COMMIT..."
firebase apphosting:rollouts:create "$BACKEND_ID" \
  --project "$PROJECT_ID" \
  --git-commit "$COMMIT" \
  --force

echo "Done: https://ccms--huji-leon.us-central1.hosted.app"
