#!/usr/bin/env bash
BLOCKED_PATTERNS=("rm -rf /" "rm -rf \." "git push.*--force.*main" "git push.*--force.*master" "git reset --hard" "git clean -fdx" "DROP TABLE" "DROP DATABASE" "terraform destroy -auto-approve")
COMMAND="$*"
for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qiE "$pattern"; then
    echo "BLOCKED: $COMMAND (pattern: $pattern)"
    exit 1
  fi
done
exit 0
