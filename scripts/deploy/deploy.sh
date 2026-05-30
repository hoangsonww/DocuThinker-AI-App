#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
NAMESPACE="docuthinker-${ENVIRONMENT}"
HELM_RELEASE="docuthinker"
HELM_CHART="./helm/docuthinker"

echo -e "${GREEN}Starting deployment to ${ENVIRONMENT}...${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
  echo -e "${RED}Error: Invalid environment. Use: dev, staging, or production${NC}"
  exit 1
fi

# Check prerequisites
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}kubectl is required but not installed${NC}"; exit 1; }
command -v helm >/dev/null 2>&1 || { echo -e "${RED}helm is required but not installed${NC}"; exit 1; }

# Verify cluster connection
echo -e "${YELLOW}Verifying cluster connection...${NC}"
if ! kubectl cluster-info &>/dev/null; then
  echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
  exit 1
fi

# Create namespace if it doesn't exist
echo -e "${YELLOW}Ensuring namespace exists...${NC}"
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets (assuming they're managed separately)
echo -e "${YELLOW}Applying secrets...${NC}"
if [ -f "secrets/${ENVIRONMENT}-secrets.yaml" ]; then
  kubectl apply -f "secrets/${ENVIRONMENT}-secrets.yaml" -n "$NAMESPACE"
fi

# Lint Helm chart
echo -e "${YELLOW}Linting Helm chart...${NC}"
helm lint "$HELM_CHART" -f "${HELM_CHART}/values-${ENVIRONMENT}.yaml"

# Dry run
echo -e "${YELLOW}Running dry-run...${NC}"
helm upgrade --install "$HELM_RELEASE" "$HELM_CHART" \
  --namespace "$NAMESPACE" \
  --values "${HELM_CHART}/values.yaml" \
  --values "${HELM_CHART}/values-${ENVIRONMENT}.yaml" \
  --dry-run

# Confirm deployment
if [ "$ENVIRONMENT" == "production" ]; then
  read -p "Deploy to PRODUCTION? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
  fi
fi

# Deploy
echo -e "${GREEN}Deploying...${NC}"
helm upgrade --install "$HELM_RELEASE" "$HELM_CHART" \
  --namespace "$NAMESPACE" \
  --values "${HELM_CHART}/values.yaml" \
  --values "${HELM_CHART}/values-${ENVIRONMENT}.yaml" \
  --wait \
  --timeout 10m \
  --atomic

# Wait for rollout
echo -e "${YELLOW}Waiting for rollout to complete...${NC}"
kubectl rollout status deployment/docuthinker-backend -n "$NAMESPACE" --timeout=5m
kubectl rollout status deployment/docuthinker-frontend -n "$NAMESPACE" --timeout=5m

# Verify deployment
echo -e "${YELLOW}Verifying deployment...${NC}"
kubectl get pods -n "$NAMESPACE"
kubectl get services -n "$NAMESPACE"
kubectl get ingress -n "$NAMESPACE"

# Run smoke tests
echo -e "${YELLOW}Running smoke tests...${NC}"
if [ -f "scripts/tests/smoke-test.sh" ]; then
  bash scripts/tests/smoke-test.sh "$ENVIRONMENT"
fi

echo -e "${GREEN}Deployment to ${ENVIRONMENT} completed successfully!${NC}"

# Print access information
INGRESS_URL=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[0].host}')
if [ -n "$INGRESS_URL" ]; then
  echo -e "${GREEN}Application available at: https://${INGRESS_URL}${NC}"
fi
