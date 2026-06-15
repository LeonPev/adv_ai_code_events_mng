#!/usr/bin/env bash

if [[ -n "${ZSH_VERSION:-}" && "${ZSH_EVAL_CONTEXT:-}" == *:file* ]]; then
  bash "$0" "$@"
  return $?
fi

if [[ -n "${BASH_VERSION:-}" && "${BASH_SOURCE[0]}" != "$0" ]]; then
  bash "${BASH_SOURCE[0]}" "$@"
  return $?
fi

set -euo pipefail

PROJECT_ID="huji-leon"
BACKEND_ID="ccms"
APP_URL="https://ccms--huji-leon.us-central1.hosted.app"
DRY_RUN="false"

for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    DRY_RUN="true"
  fi
done

echo "Deploying local source to Firebase App Hosting backend '$BACKEND_ID'..."
firebase deploy \
  --project "$PROJECT_ID" \
  --only "apphosting:$BACKEND_ID" \
  --non-interactive \
  "$@"

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run OK: $APP_URL"
else
  echo "Done: $APP_URL"
fi
