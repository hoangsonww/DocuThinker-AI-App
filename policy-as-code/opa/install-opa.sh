#!/bin/bash

# OPA Gatekeeper Installation Script
# Install and configure policy-as-code enforcement

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
GATEKEEPER_VERSION="${1:-3.14.0}"
NAMESPACE="gatekeeper-system"

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl not found"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    print_error "helm not found"
    exit 1
fi

# Add Gatekeeper Helm repository
print_info "Adding Gatekeeper Helm repository..."
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts
helm repo update

# Install Gatekeeper
print_info "Installing OPA Gatekeeper ${GATEKEEPER_VERSION}..."
helm upgrade --install gatekeeper gatekeeper/gatekeeper \
    --namespace ${NAMESPACE} \
    --create-namespace \
    --version ${GATEKEEPER_VERSION} \
    --values ./installation/values.yaml \
    --wait

# Wait for Gatekeeper pods
print_info "Waiting for Gatekeeper pods to be ready..."
kubectl wait --for=condition=ready pod \
    -l app=gatekeeper \
    -n ${NAMESPACE} \
    --timeout=300s

# Wait for webhook to be ready
print_info "Waiting for validating webhook to be ready..."
sleep 10

# Apply constraint templates
print_info "Applying constraint templates..."
kubectl apply -f ./policies/constraint-templates.yaml

# Wait for CRDs to be established
print_info "Waiting for constraint CRDs to be established..."
sleep 5

# Apply constraints
print_info "Applying constraints..."
kubectl apply -f ./policies/constraints.yaml

# Apply mutations
print_info "Applying mutations..."
kubectl apply -f ./policies/mutations.yaml || print_warning "Mutations may not be enabled"

# Verify installation
print_info "Verifying OPA Gatekeeper installation..."

# Check constraint templates
print_info "Installed constraint templates:"
kubectl get constrainttemplates

# Check constraints
print_info "Installed constraints:"
kubectl get constraints --all-namespaces

# Test policy with dry-run
print_info "Testing policies with a sample pod..."
kubectl apply --dry-run=server -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  namespace: docuthinker-prod
spec:
  containers:
  - name: nginx
    image: nginx:latest
    securityContext:
      privileged: true
EOF

print_info "========================================"
print_info "OPA Gatekeeper Installation Complete!"
print_info "========================================"
print_info ""
print_info "Gatekeeper version: ${GATEKEEPER_VERSION}"
print_info "Namespace: ${NAMESPACE}"
print_info ""
print_info "View constraint templates:"
print_info "  kubectl get constrainttemplates"
print_info ""
print_info "View constraints:"
print_info "  kubectl get constraints --all-namespaces"
print_info ""
print_info "View violations (audit):"
print_info "  kubectl get constraints -o json | jq '.items[].status.violations'"
print_info ""
print_info "Check specific constraint:"
print_info "  kubectl get k8srequiredlabels pod-must-have-labels -o yaml"
print_info ""
print_info "View Gatekeeper logs:"
print_info "  kubectl logs -l app=gatekeeper -n ${NAMESPACE}"
print_info ""
print_info "View audit logs:"
print_info "  kubectl logs -l gatekeeper.sh/operation=audit -n ${NAMESPACE}"
print_info ""

print_info "Installation completed successfully!"
