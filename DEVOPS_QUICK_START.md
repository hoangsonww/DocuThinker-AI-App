# DocuThinker DevOps Quick Start Guide

Get started with the production-ready DevOps infrastructure in minutes.

## 📋 Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Helm 3.x installed
- AWS CLI (for AWS integrations)
- 4+ CPUs, 16GB+ RAM available

## 🚀 Quick Installation

### 1. Core Platform (Required)

Install in this order:

```bash
# 1. Install cert-manager (TLS certificates)
cd tls/cert-manager
./install-cert-manager.sh v1.13.0 your-email@example.com

# 2. Install OPA Gatekeeper (Policy enforcement)
cd ../../policy-as-code/opa
./install-opa.sh 3.14.0

# 3. Install Istio Service Mesh (Traffic management & security)
cd ../../service-mesh/istio
./install-istio.sh docuthinker-prod production
```

### 2. Observability Stack

```bash
# Install OpenTelemetry Collector
helm install otel-collector open-telemetry/opentelemetry-collector \
  -n monitoring -f observability/opentelemetry/values.yaml

# Apply SLO/SLI monitoring
kubectl apply -f monitoring/slo-sli/prometheus-rules.yaml
```

### 3. Reliability & Testing

```bash
# Install Chaos Engineering
cd chaos-engineering/litmus
./install-litmus.sh 3.0.0

# Install Progressive Delivery
helm install flagger flagger/flagger \
  -n istio-system -f progressive-delivery/flagger/values.yaml

# Install Disaster Recovery
cd backup-dr/velero
./install-velero.sh v1.12.0 us-east-1 your-backup-bucket
```

### 4. Autoscaling & Optimization

```bash
# Install KEDA (Event-driven autoscaling)
helm install keda kedacore/keda \
  -n keda --create-namespace -f autoscaling/keda/values.yaml

# Apply KEDA scalers
kubectl apply -f autoscaling/keda/scalers/
```

### 5. Runtime Security

```bash
# Install Falco
helm install falco falcosecurity/falco \
  -n falco --create-namespace -f security/falco/values.yaml
```

## 🎯 Component Overview

| Component | Purpose | Status | Location |
|-----------|---------|--------|----------|
| **Istio** | Service mesh, mTLS, traffic management | ✅ | `service-mesh/istio/` |
| **OPA** | Policy enforcement, admission control | ✅ | `policy-as-code/opa/` |
| **Litmus** | Chaos engineering, resilience testing | ✅ | `chaos-engineering/litmus/` |
| **OpenTelemetry** | Distributed tracing, observability | ✅ | `observability/opentelemetry/` |
| **Velero** | Backup, disaster recovery | ✅ | `backup-dr/velero/` |
| **Flagger** | Progressive delivery, canary deployments | ✅ | `progressive-delivery/flagger/` |
| **KEDA** | Event-driven autoscaling | ✅ | `autoscaling/keda/` |
| **Falco** | Runtime security monitoring | ✅ | `security/falco/` |
| **cert-manager** | TLS certificate automation | ✅ | `tls/cert-manager/` |
| **SLO/SLI** | Service level monitoring | ✅ | `monitoring/slo-sli/` |

## 📊 Verify Installation

```bash
# Check all pods are running
kubectl get pods --all-namespaces | grep -E "istio|gatekeeper|litmus|keda|falco|velero"

# Verify Istio
istioctl analyze -n docuthinker-prod

# Check OPA policies
kubectl get constraints

# View chaos experiments
kubectl get chaosengine -A

# Check KEDA scalers
kubectl get scaledobjects -A
```

## 🔥 Run Your First Tests

### 1. Deploy Sample Application with Policies

```bash
# This will be validated by OPA
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: docuthinker-prod
  labels:
    app: backend
    version: v1.0.0
    environment: production
    team: platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
        version: v1.0.0
    spec:
      securityContext:
        runAsNonRoot: true
        fsGroup: 1000
      containers:
      - name: backend
        image: your-registry/backend:v1.0.0
        securityContext:
          runAsUser: 1000
          readOnlyRootFilesystem: true
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        ports:
        - containerPort: 8080
EOF
```

### 2. Run Chaos Test

```bash
# Test pod resilience
kubectl apply -f chaos-engineering/litmus/experiments/pod-delete-experiment.yaml

# Watch results
kubectl get chaosresult -n docuthinker-prod -w
```

### 3. Run Load Test

```bash
# Install K6
brew install k6  # or download from k6.io

# Run advanced load test
k6 run testing/load-tests/k6-advanced-scenarios.js \
  --env BASE_URL=https://api.docuthinker.example.com
```

### 4. Create Backup

```bash
# Backup namespace
velero backup create prod-backup-$(date +%Y%m%d) \
  --include-namespaces docuthinker-prod

# List backups
velero backup get
```

## 📈 Access Dashboards

```bash
# Istio Kiali (Service Mesh Observability)
kubectl port-forward svc/kiali -n istio-system 20001:20001
# Open: http://localhost:20001

# Jaeger (Distributed Tracing)
kubectl port-forward svc/jaeger-query -n istio-system 16686:16686
# Open: http://localhost:16686

# Litmus ChaosCenter
kubectl port-forward svc/chaos-litmus-frontend-service -n litmus 9091:9091
# Open: http://localhost:9091

# Grafana (Metrics)
kubectl port-forward svc/grafana -n monitoring 3000:3000
# Open: http://localhost:3000

# Prometheus (Metrics & Alerts)
kubectl port-forward svc/prometheus -n monitoring 9090:9090
# Open: http://localhost:9090
```

## 🔒 Security Best Practices

1. **mTLS Enabled**: All service-to-service communication encrypted by Istio
2. **Policy Enforcement**: OPA blocks non-compliant resources
3. **Runtime Security**: Falco detects anomalous behavior
4. **Least Privilege**: Service accounts with minimal permissions
5. **Secrets Management**: Use Vault or AWS Secrets Manager
6. **Network Policies**: Isolate namespaces and pods
7. **Image Scanning**: Block vulnerable images with OPA

## 🎭 Progressive Deployment Example

```bash
# Deploy canary with Flagger
kubectl apply -f - <<EOF
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: backend
  namespace: docuthinker-prod
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  service:
    port: 8080
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
EOF
```

## 📊 Monitoring & Alerts

View SLO compliance:

```bash
# Check if SLOs are met
kubectl port-forward svc/prometheus -n monitoring 9090:9090

# Query in Prometheus UI:
# slo:availability:met
# slo:latency:p99_met
# slo:error_budget:remaining
```

## 🔧 Troubleshooting

### Pods Not Starting

```bash
# Check OPA violations
kubectl get constraints -o json | jq '.items[].status.violations'

# Check Istio sidecar injection
kubectl get pods -n docuthinker-prod -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}'
```

### High Latency

```bash
# Check Istio traffic
istioctl dashboard kiali

# View traces in Jaeger
kubectl port-forward svc/jaeger-query -n istio-system 16686:16686
```

### Policy Violations

```bash
# List all violations
kubectl get k8srequiredlabels pod-must-have-labels -o yaml

# Test deployment
kubectl apply --dry-run=server -f deployment.yaml
```

## 📚 Next Steps

1. **Configure Slack Alerts**: Update webhook URLs in monitoring configs
2. **Set up GitOps**: Integrate with ArgoCD for automated deployments
3. **Configure Backups**: Set up Velero schedule and test restore
4. **Tune Autoscaling**: Adjust KEDA scalers based on traffic patterns
5. **Run DR Drill**: Test disaster recovery procedures monthly
6. **Review SLOs**: Ensure targets align with business requirements
7. **Chaos Testing**: Schedule weekly chaos experiments

## 🆘 Support

- **Documentation**: See `DEVOPS_ENHANCEMENTS.md` for detailed docs
- **Component READMEs**: Each directory has specific documentation
- **Troubleshooting**: Check component logs and status
- **Community**: CNCF Slack channels for each tool

## 📖 Additional Resources

- [Istio Documentation](https://istio.io/latest/docs/)
- [OPA Gatekeeper Library](https://github.com/open-policy-agent/gatekeeper-library)
- [Chaos Engineering Principles](https://principlesofchaos.org/)
- [CNCF Landscape](https://landscape.cncf.io/)

---
