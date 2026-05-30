#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT=${1:-staging}
NAMESPACE="docuthinker-${ENVIRONMENT}"
HELM_RELEASE="docuthinker"
REVISION=${2:-}

echo -e "${YELLOW}Initiating rollback for ${ENVIRONMENT}...${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
  echo -e "${RED}Error: Invalid environment${NC}"
  exit 1
fi

# Show release history
echo -e "${YELLOW}Release history:${NC}"
helm history "$HELM_RELEASE" -n "$NAMESPACE"

# Determine revision to rollback to
if [ -z "$REVISION" ]; then
  read -p "Enter revision number to rollback to (or press Enter for previous): " REVISION
fi

# Confirm rollback
read -p "Rollback $ENVIRONMENT to revision ${REVISION:-previous}? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo -e "${YELLOW}Rollback cancelled${NC}"
  exit 0
fi

# Perform rollback
echo -e "${GREEN}Rolling back...${NC}"
if [ -z "$REVISION" ]; then
  helm rollback "$HELM_RELEASE" -n "$NAMESPACE" --wait
else
  helm rollback "$HELM_RELEASE" "$REVISION" -n "$NAMESPACE" --wait
fi

# Verify rollback
echo -e "${YELLOW}Verifying rollback...${NC}"
kubectl rollout status deployment/docuthinker-backend -n "$NAMESPACE"
kubectl rollout status deployment/docuthinker-frontend -n "$NAMESPACE"

echo -e "${GREEN}Rollback completed successfully!${NC}"
