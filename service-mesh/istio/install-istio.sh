#!/bin/bash

# Istio Installation Script for DocuThinker
# Production-ready service mesh deployment with security and observability

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ISTIO_VERSION="1.20.1"
NAMESPACE="istio-system"
APP_NAMESPACE="${1:-docuthinker-prod}"
PROFILE="${2:-production}"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl not found. Please install kubectl."
    exit 1
fi

if ! command -v helm &> /dev/null; then
    print_error "helm not found. Please install helm."
    exit 1
fi

# Check cluster connectivity
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster."
    exit 1
fi

print_info "Prerequisites check passed."

# Download and install istioctl if not present
if ! command -v istioctl &> /dev/null; then
    print_info "Installing istioctl ${ISTIO_VERSION}..."
    curl -L https://istio.io/downloadIstio | ISTIO_VERSION=${ISTIO_VERSION} sh -
    export PATH="$PWD/istio-${ISTIO_VERSION}/bin:$PATH"
else
    print_info "istioctl already installed: $(istioctl version --short 2>/dev/null || echo 'unknown')"
fi

# Create namespace
print_info "Creating Istio namespace: ${NAMESPACE}"
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Label namespace for Istio injection
kubectl label namespace ${NAMESPACE} istio-injection=enabled --overwrite

# Add Istio Helm repository
print_info "Adding Istio Helm repository..."
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update

# Install Istio base (CRDs)
print_info "Installing Istio base (CRDs)..."
helm upgrade --install istio-base istio/base \
    --namespace ${NAMESPACE} \
    --version ${ISTIO_VERSION} \
    --wait

# Install Istiod (control plane)
print_info "Installing Istiod control plane..."
helm upgrade --install istiod istio/istiod \
    --namespace ${NAMESPACE} \
    --version ${ISTIO_VERSION} \
    --values ./installation/values.yaml \
    --wait

# Install Istio Ingress Gateway
print_info "Installing Istio Ingress Gateway..."
helm upgrade --install istio-ingressgateway istio/gateway \
    --namespace ${NAMESPACE} \
    --version ${ISTIO_VERSION} \
    --set labels.app=istio-ingressgateway \
    --set labels.istio=ingressgateway \
    --wait

# Install Istio Egress Gateway
print_info "Installing Istio Egress Gateway..."
helm upgrade --install istio-egressgateway istio/gateway \
    --namespace ${NAMESPACE} \
    --version ${ISTIO_VERSION} \
    --set labels.app=istio-egressgateway \
    --set labels.istio=egressgateway \
    --set service.type=ClusterIP \
    --wait

# Verify installation
print_info "Verifying Istio installation..."
kubectl wait --for=condition=available --timeout=300s \
    deployment/istiod -n ${NAMESPACE}

# Check Istio injection
print_info "Verifying Istio components..."
kubectl get pods -n ${NAMESPACE}

# Create application namespace if it doesn't exist
print_info "Setting up application namespace: ${APP_NAMESPACE}"
kubectl create namespace ${APP_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Enable Istio injection in application namespace
kubectl label namespace ${APP_NAMESPACE} istio-injection=enabled --overwrite

# Apply security policies
print_info "Applying security policies..."
kubectl apply -f ./policies/peer-authentication.yaml
kubectl apply -f ./policies/authorization-policies.yaml

# Apply traffic management rules
print_info "Applying traffic management configurations..."
kubectl apply -f ./traffic-management/gateway.yaml
kubectl apply -f ./traffic-management/destination-rules.yaml
kubectl apply -f ./traffic-management/virtual-services.yaml

# Install Kiali for observability
print_info "Installing Kiali for service mesh observability..."
helm upgrade --install kiali-server kiali/kiali-server \
    --repo https://kiali.org/helm-charts \
    --namespace ${NAMESPACE} \
    --set auth.strategy="anonymous" \
    --set deployment.ingress.enabled=false \
    --wait

# Install Jaeger for distributed tracing
print_info "Installing Jaeger for distributed tracing..."
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: istio-system
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
  namespace: istio-system
  labels:
    app: jaeger
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:1.51
        env:
        - name: COLLECTOR_ZIPKIN_HOST_PORT
          value: ":9411"
        - name: COLLECTOR_OTLP_ENABLED
          value: "true"
        ports:
        - containerPort: 5775
          protocol: UDP
        - containerPort: 6831
          protocol: UDP
        - containerPort: 6832
          protocol: UDP
        - containerPort: 5778
          protocol: TCP
        - containerPort: 16686
          protocol: TCP
        - containerPort: 9411
          protocol: TCP
        - containerPort: 4317
          protocol: TCP
        - containerPort: 4318
          protocol: TCP
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: jaeger-collector
  namespace: istio-system
  labels:
    app: jaeger
spec:
  type: ClusterIP
  ports:
  - name: jaeger-collector-http
    port: 14268
    targetPort: 14268
    protocol: TCP
  - name: jaeger-collector-grpc
    port: 14250
    targetPort: 14250
    protocol: TCP
  - port: 9411
    protocol: TCP
    name: zipkin
  - port: 4317
    protocol: TCP
    name: otlp-grpc
  - port: 4318
    protocol: TCP
    name: otlp-http
  selector:
    app: jaeger
---
apiVersion: v1
kind: Service
metadata:
  name: jaeger-query
  namespace: istio-system
  labels:
    app: jaeger
spec:
  type: ClusterIP
  ports:
  - name: query-http
    port: 16686
    protocol: TCP
    targetPort: 16686
  selector:
    app: jaeger
---
apiVersion: v1
kind: Service
metadata:
  name: zipkin
  namespace: istio-system
  labels:
    app: jaeger
spec:
  type: ClusterIP
  ports:
  - port: 9411
    protocol: TCP
    targetPort: 9411
    name: zipkin
  selector:
    app: jaeger
EOF

# Configure Istio to use Jaeger
print_info "Configuring Istio telemetry..."
kubectl apply -f - <<EOF
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  namespace: istio-system
  name: istio-telemetry
spec:
  meshConfig:
    enableTracing: true
    defaultConfig:
      tracing:
        sampling: 100.0
        zipkin:
          address: jaeger-collector.istio-system.svc.cluster.local:9411
EOF

# Get ingress gateway external IP
print_info "Waiting for Istio Ingress Gateway external IP..."
EXTERNAL_IP=""
while [ -z "$EXTERNAL_IP" ]; do
    EXTERNAL_IP=$(kubectl get svc istio-ingressgateway -n ${NAMESPACE} \
        --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}")
    if [ -z "$EXTERNAL_IP" ]; then
        print_warning "Waiting for external IP assignment..."
        sleep 10
    fi
done

print_info "Istio Ingress Gateway External IP: ${EXTERNAL_IP}"

# Display access information
print_info "========================================"
print_info "Istio Installation Complete!"
print_info "========================================"
print_info ""
print_info "Istio version: ${ISTIO_VERSION}"
print_info "Namespace: ${NAMESPACE}"
print_info "Application namespace: ${APP_NAMESPACE}"
print_info ""
print_info "Ingress Gateway: ${EXTERNAL_IP}"
print_info ""
print_info "Access Kiali dashboard:"
print_info "  kubectl port-forward svc/kiali -n ${NAMESPACE} 20001:20001"
print_info "  URL: http://localhost:20001"
print_info ""
print_info "Access Jaeger UI:"
print_info "  kubectl port-forward svc/jaeger-query -n ${NAMESPACE} 16686:16686"
print_info "  URL: http://localhost:16686"
print_info ""
print_info "View Istio proxy logs:"
print_info "  kubectl logs -l istio=ingressgateway -n ${NAMESPACE}"
print_info ""
print_info "Verify mesh status:"
print_info "  istioctl analyze -n ${APP_NAMESPACE}"
print_info "  istioctl proxy-status"
print_info ""

# Run istioctl analyze to check for issues
print_info "Running Istio configuration analysis..."
istioctl analyze -n ${APP_NAMESPACE} || print_warning "Some issues detected. Review output above."

print_info "Installation script completed successfully!"
