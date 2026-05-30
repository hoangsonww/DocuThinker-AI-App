# Istio Service Mesh for DocuThinker

Production-grade service mesh implementation providing advanced traffic management, security, and observability.

## Overview

Istio provides:
- **Automatic mTLS** encryption between all services
- **Advanced traffic routing** with canary deployments, A/B testing, and traffic mirroring
- **Circuit breaking** and connection pooling
- **Fine-grained authorization** policies
- **Distributed tracing** with Jaeger
- **Service mesh observability** with Kiali
- **Resilience** through retries, timeouts, and fault injection

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Istio Control Plane                     │
│  ┌────────┐  ┌────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Istiod │  │ Kiali  │  │  Jaeger  │  │Prometheus│         │
│  │  (HA)  │  │  (UI)  │  │ (Tracing)│  │ (Metrics)│         │
│  └────────┘  └────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Ingress Gateway  │  │ Egress Gateway   │  │   Application    │
│   (Load Bal.)    │  │ (External APIs)  │  │    Services      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Installation

### Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Helm 3.x installed
- Minimum 4 CPUs and 8GB RAM available

### Quick Install

```bash
cd service-mesh/istio
./install-istio.sh docuthinker-prod production
```

### Manual Installation

```bash
# Add Istio Helm repository
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update

# Install Istio base (CRDs)
helm install istio-base istio/base -n istio-system --create-namespace

# Install Istiod
helm install istiod istio/istiod -n istio-system \
  -f installation/values.yaml --wait

# Install gateways
helm install istio-ingressgateway istio/gateway -n istio-system
helm install istio-egressgateway istio/gateway -n istio-system \
  --set service.type=ClusterIP

# Apply policies
kubectl apply -f policies/
kubectl apply -f traffic-management/
```

## Configuration Files

### Installation
- `installation/values.yaml` - Helm values for production deployment

### Security Policies
- `policies/peer-authentication.yaml` - mTLS enforcement
- `policies/authorization-policies.yaml` - Service-to-service access control

### Traffic Management
- `traffic-management/gateway.yaml` - Ingress/egress gateways
- `traffic-management/virtual-services.yaml` - Routing rules, retries, timeouts
- `traffic-management/destination-rules.yaml` - Load balancing, circuit breaking

## Key Features

### 1. Automatic mTLS

All service-to-service communication is automatically encrypted:

```yaml
# Enforced mesh-wide in policies/peer-authentication.yaml
spec:
  mtls:
    mode: STRICT
```

### 2. Traffic Routing

**Canary Deployments:**
```yaml
# 90% stable, 10% canary
route:
- destination:
    host: backend
    subset: stable
  weight: 90
- destination:
    host: backend
    subset: canary
  weight: 10
```

**Header-based Routing:**
```yaml
# Route beta users to canary
match:
- headers:
    cookie:
      regex: ".*beta=true.*"
route:
- destination:
    subset: canary
```

### 3. Resilience Patterns

**Circuit Breaking:**
```yaml
outlierDetection:
  consecutive5xxErrors: 3
  interval: 10s
  baseEjectionTime: 60s
  maxEjectionPercent: 30
```

**Retries:**
```yaml
retries:
  attempts: 3
  perTryTimeout: 2s
  retryOn: 5xx,reset,connect-failure
```

**Timeouts:**
```yaml
timeout: 15s
```

### 4. Authorization Policies

**Default Deny:**
```yaml
# Deny all by default, explicitly allow
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
spec: {}
```

**Service-to-Service:**
```yaml
# Allow frontend -> backend
rules:
- from:
  - source:
      principals:
      - cluster.local/ns/docuthinker-prod/sa/frontend
  to:
  - operation:
      methods: ["GET", "POST"]
      paths: ["/api/*"]
```

### 5. Observability

**Distributed Tracing:**
- 100% sampling rate in production
- Full request path visibility
- Performance bottleneck identification

**Service Mesh Visualization:**
- Real-time traffic flow in Kiali
- Service dependencies graph
- Error rate monitoring

## Usage

### Enable Istio Injection

```bash
# For a namespace
kubectl label namespace docuthinker-prod istio-injection=enabled

# For specific pods (add to deployment)
metadata:
  labels:
    sidecar.istio.io/inject: "true"
```

### Access Dashboards

**Kiali (Service Mesh UI):**
```bash
kubectl port-forward svc/kiali -n istio-system 20001:20001
# Open: http://localhost:20001
```

**Jaeger (Distributed Tracing):**
```bash
kubectl port-forward svc/jaeger-query -n istio-system 16686:16686
# Open: http://localhost:16686
```

### Traffic Management Examples

**Canary Deployment:**
```bash
# Update virtual-services.yaml to adjust traffic split
# 95% stable, 5% canary
kubectl apply -f traffic-management/virtual-services.yaml
```

**A/B Testing:**
```bash
# Route users with header to new version
curl -H "x-version: v2" https://docuthinker.example.com
```

**Traffic Mirroring (Shadow Testing):**
```yaml
# Mirror 5% of traffic to canary for testing
mirror:
  host: backend
  subset: canary
mirrorPercentage:
  value: 5.0
```

### Chaos Engineering

Enable fault injection for testing:

```bash
# Inject 5s delay in 10% of requests
kubectl label virtualservice backend-fault-injection \
  enabled=true -n docuthinker-prod
```

## Monitoring

### Key Metrics

Istio automatically exports metrics to Prometheus:

- **Request rate:** `istio_requests_total`
- **Request duration:** `istio_request_duration_milliseconds`
- **Request size:** `istio_request_bytes`
- **Response size:** `istio_response_bytes`

### Grafana Dashboards

Import Istio dashboards:
```bash
# Istio Performance Dashboard
# Istio Service Dashboard
# Istio Mesh Dashboard
# Istio Control Plane Dashboard
```

### Alerts

Configure alerts for:
- High error rates (>1% 5xx errors)
- High latency (p99 >1s)
- Circuit breaker trips
- mTLS failures

## Troubleshooting

### Check Istio Status

```bash
# Analyze configuration
istioctl analyze -n docuthinker-prod

# Check proxy status
istioctl proxy-status

# View proxy configuration
istioctl proxy-config routes <pod-name> -n docuthinker-prod
```

### Debug Traffic Issues

```bash
# Check virtual services
kubectl get virtualservices -n docuthinker-prod

# Check destination rules
kubectl get destinationrules -n docuthinker-prod

# View envoy logs
kubectl logs <pod-name> -c istio-proxy -n docuthinker-prod
```

### Common Issues

**Sidecar Not Injected:**
```bash
# Check namespace label
kubectl get namespace docuthinker-prod --show-labels

# Manually inject
istioctl kube-inject -f deployment.yaml | kubectl apply -f -
```

**mTLS Conflicts:**
```bash
# Check peer authentication
kubectl get peerauthentication -A

# Verify certificate
istioctl proxy-config secret <pod-name> -n docuthinker-prod
```

## Security Best Practices

1. **Enforce Strict mTLS** - All inter-service communication encrypted
2. **Default Deny** - Explicitly allow only necessary traffic
3. **Least Privilege** - Service accounts with minimal permissions
4. **Network Segmentation** - Isolate environments with authorization policies
5. **Certificate Rotation** - Automatic 90-day certificate lifecycle
6. **Audit Logging** - Enable access logs for compliance

## Performance Tuning

### Resource Limits

Production istiod:
```yaml
resources:
  requests:
    cpu: 500m
    memory: 2Gi
  limits:
    cpu: 2000m
    memory: 4Gi
```

Sidecar proxy:
```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 2000m
    memory: 1Gi
```

### Connection Pooling

```yaml
connectionPool:
  tcp:
    maxConnections: 2000
  http:
    http2MaxRequests: 2048
    maxRequestsPerConnection: 50
```

## Maintenance

### Upgrade Istio

```bash
# Download new version
istioctl upgrade --set profile=production

# Or via Helm
helm upgrade istiod istio/istiod -n istio-system \
  -f installation/values.yaml
```

### Backup Configuration

```bash
# Export all Istio resources
kubectl get gateway,virtualservice,destinationrule,serviceentry \
  -n docuthinker-prod -o yaml > istio-backup.yaml
```

## Integration with Existing Tools

- **Prometheus** - Metrics collection (automatic)
- **Grafana** - Visualization dashboards
- **Jaeger** - Distributed tracing
- **Kiali** - Service mesh observability
- **cert-manager** - External CA integration
- **ArgoCD** - GitOps deployment

## Cost Optimization

- Sidecars add ~100MB memory per pod
- Ingress gateway: ~500MB memory
- Istiod (3 replicas): ~6GB total memory
- **Total overhead:** ~15-20% for production workload

## References

- [Istio Documentation](https://istio.io/latest/docs/)
- [Istio Best Practices](https://istio.io/latest/docs/ops/best-practices/)
- [Kiali Documentation](https://kiali.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)

## Support

For issues or questions:
1. Check Istio logs: `kubectl logs -n istio-system -l app=istiod`
2. Run analysis: `istioctl analyze`
3. Review Kiali for traffic anomalies
4. Check Jaeger for trace errors
