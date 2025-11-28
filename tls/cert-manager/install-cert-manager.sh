#!/bin/bash

# cert-manager Installation Script
# Automated TLS certificate management with Let's Encrypt

set -euo pipefail

GREEN='\033[0;32m'
NC='\033[0m'
print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }

VERSION="${1:-v1.13.0}"
EMAIL="${2:-admin@docuthinker.example.com}"

print_info "Installing cert-manager ${VERSION}..."

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/${VERSION}/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n cert-manager
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-webhook -n cert-manager

# Create Let's Encrypt issuers
kubectl apply -f - <<EOF
---
# Let's Encrypt Staging Issuer (for testing)
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: ${EMAIL}
    privateKeySecretRef:
      name: letsencrypt-staging-key
    solvers:
    - http01:
        ingress:
          class: nginx
    - dns01:
        route53:
          region: us-east-1
---
# Let's Encrypt Production Issuer
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ${EMAIL}
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
    - http01:
        ingress:
          class: nginx
    - dns01:
        route53:
          region: us-east-1
---
# Self-signed issuer for internal services
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
EOF

print_info "cert-manager installed successfully!"
print_info "Annotate ingress with: cert-manager.io/cluster-issuer: letsencrypt-prod"
