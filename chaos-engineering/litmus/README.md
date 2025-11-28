# Litmus Chaos Engineering for DocuThinker

Production-grade chaos engineering platform for validating system resilience and reliability.

## Overview

Litmus enables controlled chaos experiments to:
- **Validate resilience** to pod failures, network issues, and resource constraints
- **Identify weaknesses** before they cause production outages
- **Build confidence** in system recovery capabilities
- **Automate chaos testing** with scheduled experiments
- **Monitor impact** with integrated observability

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Litmus ChaosCenter                     │
│            (UI, Workflow Engine, Analytics)             │
└─────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
    ┌───────────┐  ┌───────────┐  ┌───────────┐
    │  Chaos    │  │  Chaos    │  │  Chaos    │
    │ Operator  │  │ Exporter  │  │  Runner   │
    └───────────┘  └───────────┘  └───────────┘
            │              │              │
            └──────────────┼──────────────┘
                           ▼
            ┌──────────────────────────┐
            │   Target Applications    │
            │  (Backend, Frontend, DB) │
            └──────────────────────────┘
```

## Installation

### Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl and helm installed
- Admin access to cluster
- Prometheus for metrics (optional)

### Quick Install

```bash
cd chaos-engineering/litmus
./install-litmus.sh 3.0.0
```

### Manual Installation

```bash
# Add Litmus Helm repo
helm repo add litmuschaos https://litmuschaos.github.io/litmus-helm/
helm repo update

# Install Litmus
helm install litmus litmuschaos/litmus \
  --namespace litmus \
  --create-namespace \
  -f installation/values.yaml

# Install chaos experiments
kubectl apply -f https://hub.litmuschaos.io/api/chaos/3.0.0?file=charts/generic/experiments.yaml
```

## Available Chaos Experiments

### Pod-Level Experiments

1. **Pod Delete** - Kills pods to test auto-recovery
2. **Pod CPU Hog** - Stresses CPU to validate resource limits
3. **Pod Memory Hog** - Fills memory to test OOM handling
4. **Container Kill** - Terminates containers within pods
5. **Pod Network Latency** - Injects network delays
6. **Pod Network Loss** - Drops network packets
7. **Pod Network Corruption** - Corrupts network packets

### Node-Level Experiments

1. **Node CPU Hog** - Stresses node CPU
2. **Node Memory Hog** - Fills node memory
3. **Node Drain** - Cordons and drains nodes
4. **Node Restart** - Reboots nodes

### Application-Level Experiments

1. **HTTP Chaos** - Injects HTTP errors and latency
2. **Disk Fill** - Fills ephemeral storage
3. **Spring Boot Chaos** - Java application-specific chaos

### Cloud-Specific (AWS)

1. **EC2 Terminate** - Terminates EC2 instances
2. **EBS Loss** - Detaches EBS volumes
3. **AZ Outage** - Simulates availability zone failure

## Running Chaos Experiments

### Simple Pod Delete

```bash
kubectl apply -f experiments/pod-delete-experiment.yaml
```

Monitor the experiment:
```bash
# Watch pods
kubectl get pods -n docuthinker-prod -w

# Check chaos engine status
kubectl get chaosengine -n docuthinker-prod

# View chaos results
kubectl describe chaosresult backend-pod-delete -n docuthinker-prod
```

### Network Latency Test

```bash
kubectl apply -f experiments/network-latency-experiment.yaml
```

This injects 2000ms latency to 50% of backend pods and validates:
- API response times remain acceptable
- Services remain available
- No cascading failures

### Resource Stress Test

```bash
# CPU stress
kubectl apply -f experiments/resource-stress-experiment.yaml

# This validates:
# - CPU throttling doesn't crash the app
# - HPA scales up appropriately
# - Resource limits are properly set
```

### Comprehensive Workflow

Run a full chaos workflow:

```bash
kubectl apply -f workflows/comprehensive-chaos-workflow.yaml
```

This sequentially runs:
1. Pod delete chaos
2. Network latency chaos
3. CPU stress chaos
4. Memory stress chaos
5. Health verification after each step

## Chaos Workflows

Workflows allow chaining multiple experiments:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: my-chaos-workflow
spec:
  entrypoint: chaos-tests
  templates:
    - name: chaos-tests
      steps:
        - - name: pod-delete
            template: pod-delete-chaos
        - - name: verify-health
            template: health-check
```

## Scheduled Chaos

Automate chaos testing with schedules:

```yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosSchedule
metadata:
  name: daily-pod-delete
spec:
  schedule:
    repeat:
      properties:
        minChaosInterval: 24h
  engineTemplateSpec:
    experiments:
      - name: pod-delete
```

## Probes & Health Checks

Litmus supports multiple probe types:

### HTTP Probe

```yaml
probe:
  - name: check-api-health
    type: httpProbe
    httpProbe/inputs:
      url: http://backend:8080/health
      method:
        get:
          criteria: ==
          responseCode: "200"
    mode: Continuous
```

### Command Probe

```yaml
probe:
  - name: check-database
    type: cmdProbe
    cmdProbe/inputs:
      command: "psql -c 'SELECT 1'"
      comparator:
        type: string
        criteria: contains
        value: "1 row"
```

### Kubernetes Probe

```yaml
probe:
  - name: check-pods-running
    type: k8sProbe
    k8sProbe/inputs:
      resource: pods
      namespace: docuthinker-prod
      labelSelector: app=backend
      fieldSelector: status.phase=Running
```

### Prometheus Probe

```yaml
probe:
  - name: check-error-rate
    type: promProbe
    promProbe/inputs:
      endpoint: http://prometheus:9090
      query: "rate(http_requests_total{status=~'5..'}[1m])"
      comparator:
        criteria: <=
        value: "0.05"
```

## Access Chaos Center

```bash
# Port forward
kubectl port-forward svc/chaos-litmus-frontend-service -n litmus 9091:9091

# Open browser
open http://localhost:9091
```

Default credentials:
- Username: `admin`
- Password: `litmus`

## Monitoring Chaos Experiments

### View Chaos Results

```bash
# List all chaos results
kubectl get chaosresult -n docuthinker-prod

# Describe specific result
kubectl describe chaosresult <name> -n docuthinker-prod

# Get experiment verdict
kubectl get chaosresult <name> -n docuthinker-prod \
  -o jsonpath='{.status.experimentStatus.verdict}'
```

### Prometheus Metrics

Litmus exports metrics via chaos-exporter:

```promql
# Total chaos experiments
litmuschaos_cluster_scoped_experiments_total

# Passed experiments
litmuschaos_passed_experiments

# Failed experiments
litmuschaos_failed_experiments

# Experiment run count
litmuschaos_experiment_runs_count{chaosresult_name="backend-pod-delete"}
```

### Grafana Dashboard

Import dashboard ID: `12349` for Litmus metrics visualization.

## Best Practices

### 1. Start Small

Begin with:
- Single pod deletion
- Low percentage of affected pods (20-30%)
- Short duration (30-60 seconds)
- Non-production environment first

### 2. Use Probes

Always define probes to validate:
- Service availability
- Response times
- Data consistency
- Recovery success

### 3. Blast Radius Control

```yaml
# Limit impact
env:
  - name: PODS_AFFECTED_PERC
    value: '30'  # Max 30% of pods
  - name: SEQUENCE
    value: serial  # One at a time
```

### 4. Schedule During Maintenance Windows

```yaml
schedule:
  # Sunday 2 AM
  repeat:
    properties:
      minChaosInterval: 168h
```

### 5. Document Results

After each experiment:
- Record outcomes
- Identify improvements
- Update runbooks
- Fix discovered issues

## Safety Guardrails

### Resource Limits

```yaml
# Prevent runaway experiments
spec:
  components:
    env:
      - name: TOTAL_CHAOS_DURATION
        value: '120'  # Max 2 minutes
```

### Emergency Stop

```bash
# Stop chaos engine
kubectl patch chaosengine <name> \
  -p '{"spec":{"engineState":"stop"}}' \
  --type=merge

# Delete chaos engine
kubectl delete chaosengine <name>
```

### Cleanup

```bash
# Delete all chaos experiments
kubectl delete chaosengine --all -n docuthinker-prod

# Clean up chaos runner pods
kubectl delete pods -l chaosUID -n docuthinker-prod
```

## Troubleshooting

### Experiment Not Starting

```bash
# Check chaos operator logs
kubectl logs -l app=chaos-operator -n litmus

# Check service account permissions
kubectl auth can-i create pods \
  --as=system:serviceaccount:docuthinker-prod:litmus-admin
```

### Experiment Failed

```bash
# Check chaos runner logs
kubectl logs -l job-name=<experiment-name> -n docuthinker-prod

# Check chaos result
kubectl get chaosresult <name> -n docuthinker-prod -o yaml
```

### Probes Failing

```bash
# Test probe manually
kubectl run test --rm -it --image=curlimages/curl -- \
  curl http://backend:8080/health
```

## Integration with CI/CD

Add to GitLab CI:

```yaml
chaos-testing:
  stage: test
  script:
    - kubectl apply -f chaos-engineering/litmus/experiments/
    - kubectl wait --for=condition=complete \
        chaosengine/backend-pod-delete --timeout=300s
    - kubectl get chaosresult -o yaml
  only:
    - schedules
```

## Compliance & Auditing

Litmus provides:
- **Audit logs** of all chaos activities
- **Result tracking** with Pass/Fail verdicts
- **Experiment history** for compliance
- **Access control** via RBAC

## Cost Considerations

- Chaos operator: ~256MB memory
- Chaos exporter: ~256MB memory
- ChaosCenter: ~1GB memory
- Per experiment: ~100-200MB during execution

## References

- [Litmus Documentation](https://docs.litmuschaos.io/)
- [Chaos Hub](https://hub.litmuschaos.io/)
- [Principles of Chaos Engineering](https://principlesofchaos.org/)

## Support

For issues:
1. Check chaos operator logs
2. Review experiment definition
3. Verify service account permissions
4. Check probe configurations
