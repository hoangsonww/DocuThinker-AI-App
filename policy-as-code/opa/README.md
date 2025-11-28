# OPA Gatekeeper - Policy as Code for DocuThinker

Enforce security, compliance, and operational policies across Kubernetes clusters using Open Policy Agent (OPA) Gatekeeper.

## Overview

OPA Gatekeeper provides:
- **Admission Control** - Validate resources before creation
- **Mutation** - Automatically modify resources to meet standards
- **Audit** - Continuously scan existing resources for violations
- **Policy Templates** - Reusable policy definitions
- **Compliance Reporting** - Track policy violations

## Architecture

```
┌────────────────────────────────────────────────┐
│           Kubernetes API Server                │
└────────────────┬───────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  OPA Gatekeeper │
        │   Webhook       │
        └────────┬────────┘
                 │
        ┌────────▼────────────────────┐
        │  Validate Against Policies  │
        │  - Constraint Templates     │
        │  - Constraints              │
        └────────┬────────────────────┘
                 │
        ┌────────▼────────┐
        │  Allow/Deny     │
        │  or Mutate      │
        └─────────────────┘
```

## Installation

### Quick Install

```bash
cd policy-as-code/opa
./install-opa.sh 3.14.0
```

### Manual Installation

```bash
# Add Helm repository
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts
helm repo update

# Install Gatekeeper
helm install gatekeeper gatekeeper/gatekeeper \
  --namespace gatekeeper-system \
  --create-namespace \
  -f installation/values.yaml

# Apply policies
kubectl apply -f policies/constraint-templates.yaml
kubectl apply -f policies/constraints.yaml
kubectl apply -f policies/mutations.yaml
```

## Policy Enforcement

### Constraint Templates

Reusable policy definitions written in Rego:

**Example: Require Labels**
```rego
package k8srequiredlabels

violation[{"msg": msg, "details": {"missing_labels": missing}}] {
  provided := {label | input.review.object.metadata.labels[label]}
  required := {label | label := input.parameters.labels[_]}
  missing := required - provided
  count(missing) > 0
  msg := sprintf("You must provide labels: %v", [missing])
}
```

### Active Policies

1. **Security Policies**
   - Block privileged containers
   - Enforce non-root users
   - Require read-only root filesystem
   - Block host namespaces (network, PID, IPC)

2. **Resource Management**
   - Require CPU/memory limits
   - Require CPU/memory requests
   - Enforce minimum replica counts

3. **Image Security**
   - Block `:latest` tag
   - Enforce trusted registries
   - Require image tags

4. **Compliance**
   - Require standard labels (app, version, environment, team)
   - Track managed resources

## Using Policies

### Test Before Apply

Always test with dry-run:

```bash
kubectl apply --dry-run=server -f deployment.yaml
```

### Valid Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: docuthinker-prod
  labels:
    app: backend
    version: v1.2.3
    environment: production
    team: platform
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: backend
        version: v1.2.3
        environment: production
        team: platform
    spec:
      securityContext:
        runAsNonRoot: true
        fsGroup: 1000
      containers:
      - name: backend
        image: registry.gitlab.com/hoangsonww/docuthinker-ai-app/backend:v1.2.3
        imagePullPolicy: IfNotPresent
        securityContext:
          runAsUser: 1000
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

### Policy Violations

**Invalid: Missing Labels**
```yaml
# ❌ DENIED - Missing required labels
apiVersion: v1
kind: Pod
metadata:
  name: test
  namespace: docuthinker-prod
spec:
  containers:
  - name: nginx
    image: nginx:1.21
```

Error:
```
You must provide labels: ["app", "version", "environment", "team"]
```

**Invalid: Privileged Container**
```yaml
# ❌ DENIED - Privileged containers not allowed
containers:
- name: test
  image: nginx:1.21
  securityContext:
    privileged: true
```

Error:
```
Privileged container is not allowed: test
```

**Invalid: Latest Tag**
```yaml
# ❌ DENIED - Latest tag not allowed
containers:
- name: test
  image: nginx:latest
```

Error:
```
Container test uses latest tag which is not allowed
```

## Mutations

Automatically modify resources to enforce standards:

### Auto-Add Resource Limits

If you don't specify limits, Gatekeeper adds defaults:

```yaml
# You create:
containers:
- name: app
  image: myapp:1.0

# Gatekeeper mutates to:
containers:
- name: app
  image: myapp:1.0
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
```

### Auto-Add Labels

Missing labels are automatically added:

```yaml
# You create:
metadata:
  name: my-pod

# Gatekeeper mutates to:
metadata:
  name: my-pod
  labels:
    environment: production
    team: platform
    managed-by: opa-gatekeeper
```

## Audit Mode

Gatekeeper continuously scans existing resources:

```bash
# View violations
kubectl get constraints -o json | \
  jq '.items[] | select(.status.totalViolations > 0) |
      {name: .metadata.name, violations: .status.violations}'

# Check specific constraint
kubectl get k8srequiredlabels pod-must-have-labels -o yaml
```

Example output:
```yaml
status:
  auditTimestamp: "2024-01-15T10:30:00Z"
  totalViolations: 3
  violations:
  - enforcementAction: deny
    kind: Pod
    name: legacy-pod
    namespace: docuthinker-prod
    message: "You must provide labels: [\"team\"]"
```

## Enforcement Actions

Configure how violations are handled:

### Deny (Default)

```yaml
spec:
  enforcementAction: deny  # Block resource creation
```

### Warn

```yaml
spec:
  enforcementAction: warn  # Allow but log warning
```

### Dryrun

```yaml
spec:
  enforcementAction: dryrun  # Audit only, no blocking
```

## Monitoring

### Prometheus Metrics

Gatekeeper exports metrics:

```promql
# Total violations
gatekeeper_violations{enforcement_action="deny"}

# Constraint templates
gatekeeper_constraint_templates

# Webhook requests
gatekeeper_validation_request_count

# Webhook duration
gatekeeper_validation_request_duration_seconds
```

### Grafana Dashboard

Import dashboard for OPA Gatekeeper monitoring.

### Alerts

Example Prometheus alert:

```yaml
- alert: PolicyViolationsHigh
  expr: gatekeeper_violations > 10
  for: 5m
  annotations:
    summary: "High number of policy violations detected"
```

## Debugging

### Test Policies Locally

```bash
# Install opa CLI
brew install opa

# Test policy
opa test policies/
```

### View Gatekeeper Logs

```bash
# Controller logs
kubectl logs -l control-plane=controller-manager -n gatekeeper-system

# Audit logs
kubectl logs -l control-plane=audit-controller -n gatekeeper-system

# Webhook logs
kubectl logs -l gatekeeper.sh/operation=webhook -n gatekeeper-system
```

### Troubleshoot Denied Resources

```bash
# Get detailed error
kubectl apply -f deployment.yaml -v=8

# Check webhook configuration
kubectl get validatingwebhookconfigurations

# Describe constraint
kubectl describe k8srequiredlabels pod-must-have-labels
```

## Policy Development

### Create Custom Policy

1. **Define Constraint Template**

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8scustompolicy
spec:
  crd:
    spec:
      names:
        kind: K8sCustomPolicy
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8scustompolicy

        violation[{"msg": msg}] {
          # Your policy logic here
          msg := "Policy violation detected"
        }
```

2. **Create Constraint**

```yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sCustomPolicy
metadata:
  name: my-policy
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
```

3. **Test**

```bash
kubectl apply -f constraint-template.yaml
kubectl apply -f constraint.yaml
kubectl apply --dry-run=server -f test-pod.yaml
```

## Best Practices

### 1. Start with Dryrun

```yaml
spec:
  enforcementAction: dryrun  # Test first
```

### 2. Exclude System Namespaces

```yaml
spec:
  match:
    excludedNamespaces:
      - kube-system
      - kube-public
```

### 3. Use Specific Matchers

```yaml
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
    namespaces:
      - docuthinker-prod
```

### 4. Document Policies

Add descriptions to templates:

```yaml
metadata:
  annotations:
    description: "Requires all pods to have resource limits"
```

### 5. Regular Audits

```bash
# Weekly audit
kubectl get constraints -o json | \
  jq '.items[].status.violations' > violations-$(date +%Y-%m-%d).json
```

## Compliance Scenarios

### PCI-DSS

```yaml
# Network isolation
- Block host networking
- Require network policies
- Enforce egress restrictions
```

### SOC 2

```yaml
# Access control
- Require service accounts
- Block privileged access
- Audit all changes
```

### CIS Kubernetes Benchmark

```yaml
# Security hardening
- Non-root containers
- Read-only filesystems
- Drop capabilities
- No privileged containers
```

## Integration

### GitOps (ArgoCD)

Policies are applied automatically via GitOps:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: opa-policies
spec:
  source:
    path: policy-as-code/opa/policies
```

### CI/CD (GitLab)

```yaml
policy-check:
  stage: validate
  script:
    - kubectl apply --dry-run=server -f k8s/
```

## Limitations

- **Performance**: Adds latency to API requests (~10-50ms)
- **Complexity**: Rego learning curve
- **Scope**: Only validates on create/update, not mutations to running pods

## References

- [OPA Documentation](https://www.openpolicyagent.org/docs/)
- [Gatekeeper Documentation](https://open-policy-agent.github.io/gatekeeper/)
- [Policy Library](https://github.com/open-policy-agent/gatekeeper-library)
- [Rego Playground](https://play.openpolicyagent.org/)

## Support

For issues:
1. Check Gatekeeper logs
2. Verify constraint template syntax
3. Test with `--dry-run=server`
4. Review constraint status
