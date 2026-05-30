#!/usr/bin/env bash
set -e
STAGED=$(git diff --cached --name-only 2>/dev/null || echo "")
for file in $STAGED; do
  if echo "$file" | grep -qE '\.env$|firebase-admin-sdk\.json|credentials\.json|\.pem$|\.key$'; then
    echo "BLOCKED: Potential secrets file: $file"
    exit 1
  fi
  if [ -f "$file" ] && file "$file" | grep -q text; then
    if grep -qE '(AKIA[A-Z0-9]{16}|sk-[a-zA-Z0-9]{40,}|-----BEGIN (RSA )?PRIVATE KEY-----)' "$file" 2>/dev/null; then
      echo "BLOCKED: Secret detected in $file"
      exit 1
    fi
  fi
done
echo "Pre-commit checks passed"
