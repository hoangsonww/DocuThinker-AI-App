#!/bin/bash

# Litmus Chaos Engineering Installation Script
# Installs and configures Litmus for chaos testing

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
LITMUS_VERSION="${1:-3.0.0}"
NAMESPACE="litmus"
APP_NAMESPACE="docuthinker-prod"

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

# Create namespace
print_info "Creating Litmus namespace..."
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Add Litmus Helm repository
print_info "Adding Litmus Helm repository..."
helm repo add litmuschaos https://litmuschaos.github.io/litmus-helm/
helm repo update

# Install Litmus
print_info "Installing Litmus ${LITMUS_VERSION}..."
helm upgrade --install litmus litmuschaos/litmus \
    --namespace ${NAMESPACE} \
    --version ${LITMUS_VERSION} \
    --values ./installation/values.yaml \
    --wait

# Wait for Litmus pods
print_info "Waiting for Litmus pods to be ready..."
kubectl wait --for=condition=ready pod \
    -l app.kubernetes.io/name=litmus \
    -n ${NAMESPACE} \
    --timeout=300s

# Install ChaosCenter
print_info "Installing Litmus ChaosCenter..."
kubectl apply -f https://litmuschaos.github.io/litmus/litmus-operator-v${LITMUS_VERSION}.yaml

# Create service account for chaos experiments
print_info "Creating chaos service account..."
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: litmus-admin
  namespace: ${APP_NAMESPACE}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: litmus-admin
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log", "pods/exec", "events", "services"]
    verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets", "replicasets", "daemonsets"]
    verbs: ["create", "delete", "get", "list", "patch", "update"]
  - apiGroups: ["batch"]
    resources: ["jobs"]
    verbs: ["create", "delete", "get", "list", "patch", "update"]
  - apiGroups: ["litmuschaos.io"]
    resources: ["chaosengines", "chaosexperiments", "chaosresults"]
    verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: litmus-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: litmus-admin
subjects:
  - kind: ServiceAccount
    name: litmus-admin
    namespace: ${APP_NAMESPACE}
EOF

# Install chaos experiments
print_info "Installing chaos experiments..."
kubectl apply -f https://hub.litmuschaos.io/api/chaos/${LITMUS_VERSION}?file=charts/generic/experiments.yaml -n ${APP_NAMESPACE}

# Install custom chaos experiments
print_info "Applying custom chaos experiments..."
if [ -d "./experiments" ]; then
    kubectl apply -f ./experiments/ || print_warning "No custom experiments found"
fi

# Get Litmus frontend service
print_info "Getting Litmus ChaosCenter URL..."
FRONTEND_SERVICE=$(kubectl get svc chaos-litmus-frontend-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ -z "$FRONTEND_SERVICE" ]; then
    FRONTEND_SERVICE=$(kubectl get svc chaos-litmus-frontend-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
fi

print_info "========================================"
print_info "Litmus Chaos Engineering Installation Complete!"
print_info "========================================"
print_info ""
print_info "Litmus version: ${LITMUS_VERSION}"
print_info "Namespace: ${NAMESPACE}"
print_info "Application namespace: ${APP_NAMESPACE}"
print_info ""

if [ -n "$FRONTEND_SERVICE" ]; then
    print_info "ChaosCenter URL: http://${FRONTEND_SERVICE}:9091"
else
    print_info "Access ChaosCenter via port-forward:"
    print_info "  kubectl port-forward svc/chaos-litmus-frontend-service -n ${NAMESPACE} 9091:9091"
    print_info "  URL: http://localhost:9091"
fi

print_info ""
print_info "Default credentials:"
print_info "  Username: admin"
print_info "  Password: litmus"
print_info ""
print_info "Run a chaos experiment:"
print_info "  kubectl apply -f experiments/pod-delete-experiment.yaml"
print_info ""
print_info "View chaos results:"
print_info "  kubectl get chaosresult -n ${APP_NAMESPACE}"
print_info ""

print_info "Installation completed successfully!"
