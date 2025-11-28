# DocuThinker DevOps Documentation

Comprehensive guide for deploying, monitoring, and maintaining DocuThinker's enterprise-grade infrastructure.

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Getting Started](#getting-started)
3. [Service Mesh - Istio](#service-mesh---istio)
4. [Policy Enforcement - OPA](#policy-enforcement---opa)
5. [CI/CD Pipelines](#cicd-pipelines)
6. [Kubernetes Deployments](#kubernetes-deployments)
7. [Progressive Delivery - Flagger](#progressive-delivery---flagger)
8. [Monitoring & Observability](#monitoring--observability)
9. [Chaos Engineering - Litmus](#chaos-engineering---litmus)
10. [Disaster Recovery - Velero](#disaster-recovery---velero)
11. [Autoscaling - KEDA](#autoscaling---keda)
12. [Runtime Security - Falco](#runtime-security---falco)
13. [Secret Management](#secret-management)
14. [Performance Testing](#performance-testing)
15. [Database Migrations](#database-migrations)
16. [Infrastructure Testing](#infrastructure-testing)
17. [Security](#security)
18. [Troubleshooting](#troubleshooting)

## Infrastructure Overview

DocuThinker uses a modern, enterprise-grade cloud-native architecture with **15 production-ready DevOps components**.

### Technology Stack

- **Cloud Provider**: AWS
- **Container Orchestration**: Amazon EKS (Kubernetes 1.28+)
- **Service Mesh**: Istio 1.20 (mTLS, Circuit Breaking, Traffic Management)
- **Policy Enforcement**: OPA Gatekeeper 3.14 (Security & Compliance)
- **Infrastructure as Code**: Terraform + Helm
- **CI/CD**: GitLab CI / GitHub Actions / Jenkins
- **GitOps**: ArgoCD
- **Observability**: OpenTelemetry + Prometheus + Grafana + Jaeger + ELK
- **Chaos Engineering**: Litmus 3.0
- **Progressive Delivery**: Flagger 1.34
- **Backup & DR**: Velero 1.12 (RTO < 1 hour)
- **Event-Driven Autoscaling**: KEDA 2.12
- **Runtime Security**: Falco 0.36
- **Secret Management**: HashiCorp Vault + AWS Secrets Manager
- **Performance Testing**: K6 (6 advanced scenarios)
- **TLS Management**: cert-manager 1.13
- **Database Migrations**: Flyway
- **Infrastructure Testing**: Terratest

### Architecture Diagram

```mermaid
graph TB
    subgraph "AWS Cloud - Production Infrastructure"
        subgraph "Edge Layer"
            CF[CloudFront CDN]
            WAF[AWS WAF<br/>DDoS Protection]
            CERTMGR[cert-manager<br/>Auto TLS]
        end

        subgraph "Service Mesh - Istio"
            ISTIO_IG[Istio Ingress Gateway<br/>3 Replicas + mTLS]
            ISTIO_EG[Istio Egress Gateway<br/>Controlled External Access]
            ISTIOD[Istiod Control Plane<br/>HA - 3 Replicas]
        end

        subgraph "Policy & Security Layer"
            OPA[OPA Gatekeeper<br/>10 Policies + 8 Mutations]
            FALCO[Falco<br/>Runtime Threat Detection]
            NETPOL[Network Policies]
        end

        subgraph "VPC - Multi-AZ (3 Zones)"
            subgraph "Public Subnets"
                NAT1[NAT Gateway AZ-1]
                NAT2[NAT Gateway AZ-2]
                NAT3[NAT Gateway AZ-3]
            end

            subgraph "Private Subnets - EKS Cluster"
                subgraph "Application Pods - With Envoy Sidecars"
                    FE1[Frontend 1 + Envoy]
                    FE2[Frontend 2 + Envoy]
                    FE3[Frontend 3 + Envoy]
                    BE1[Backend 1 + Envoy]
                    BE2[Backend 2 + Envoy]
                    BE3[Backend 3 + Envoy]
                end

                subgraph "Progressive Delivery"
                    FLAGGER[Flagger<br/>Automated Canary]
                    CANARY[Canary Deployment<br/>10% Traffic]
                end

                subgraph "Observability Stack"
                    OTEL[OpenTelemetry<br/>3 Replicas]
                    PROM[Prometheus<br/>SLO/SLI Monitoring]
                    GRAF[Grafana<br/>Dashboards]
                    JAEGER[Jaeger<br/>Distributed Tracing]
                    ELK[ELK Stack<br/>Logs]
                end

                subgraph "Reliability Engineering"
                    LITMUS[Litmus Chaos<br/>4 Experiments]
                    VELERO[Velero<br/>Daily + Hourly Backups]
                end

                subgraph "Autoscaling"
                    KEDA[KEDA<br/>Event-Driven HPA]
                    HPA[Traditional HPA<br/>CPU/Memory]
                end

                subgraph "Data Layer"
                    RDS[(PostgreSQL RDS<br/>Multi-AZ + Flyway)]
                    REDIS[(ElastiCache Redis<br/>Cluster Mode)]
                end
            end
        end

        subgraph "Security & Secrets"
            VAULT[HashiCorp Vault<br/>HA]
            SM[AWS Secrets Manager]
            ESO[External Secrets Operator]
        end

        subgraph "Storage"
            S3[S3 Buckets<br/>Versioning + Lifecycle]
        end

        subgraph "Testing"
            K6[K6 Load Tests<br/>6 Scenarios]
            TERRATEST[Terratest<br/>Infrastructure Validation]
        end
    end

    Users -->|HTTPS| CF
    CF --> WAF
    WAF --> CERTMGR
    CERTMGR --> ISTIO_IG

    ISTIOD -.->|Config + Certs| ISTIO_IG
    ISTIO_IG -.->|Policy Check| OPA

    ISTIO_IG --> FE1 & FE2 & FE3
    FE1 & FE2 & FE3 -->|mTLS| BE1 & BE2 & BE3

    FLAGGER -.->|Manage| CANARY
    CANARY -.->|10% Traffic| BE3

    BE1 & BE2 & BE3 --> RDS
    BE1 & BE2 & BE3 --> REDIS
    BE1 & BE2 & BE3 --> S3

    BE1 -.->|Traces| OTEL
    OTEL --> JAEGER
    OTEL --> PROM
    PROM --> GRAF
    BE1 -.->|Logs| ELK

    FALCO -.->|Monitor| BE1 & BE2 & BE3
    LITMUS -.->|Test| BE1 & BE2
    VELERO -.->|Backup| RDS

    KEDA -.->|Scale| BE1 & BE2 & BE3
    HPA -.->|Scale| FE1 & FE2 & FE3

    VAULT --> ESO
    SM --> ESO
    ESO -.->|Sync| BE1 & BE2 & BE3

    K6 -.->|Test| ISTIO_IG
    TERRATEST -.->|Validate| RDS & S3

    style ISTIO_IG fill:#FF6B6B,color:#fff
    style OPA fill:#4ECDC4,color:#fff
    style OTEL fill:#F38181,color:#fff
    style LITMUS fill:#AA96DA,color:#fff
    style FLAGGER fill:#95E1D3
    style KEDA fill:#FCBAD3
    style VELERO fill:#FFD93D
```

---

## Getting Started

### Prerequisites

Install required tools:

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Terraform
brew install terraform

# istioctl
curl -L https://istio.io/downloadIstio | sh -

# k6
brew install k6

# velero
brew install velero
```

### Initial Setup

1. **Configure AWS credentials**:
   ```bash
   aws configure
   ```

2. **Deploy infrastructure with Terraform**:
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```

3. **Configure kubectl**:
   ```bash
   aws eks update-kubeconfig --name docuthinker-eks-prod --region us-east-1
   ```

4. **Install core platform components**:
   ```bash
   # cert-manager (TLS automation)
   cd tls/cert-manager
   ./install-cert-manager.sh v1.13.0 admin@docuthinker.example.com

   # OPA Gatekeeper (Policy enforcement)
   cd ../../policy-as-code/opa
   ./install-opa.sh 3.14.0

   # Istio Service Mesh (Traffic management + mTLS)
   cd ../../service-mesh/istio
   ./install-istio.sh docuthinker-prod production
   ```

5. **Install observability stack**:
   ```bash
   # OpenTelemetry
   helm install otel-collector open-telemetry/opentelemetry-collector \
     -n monitoring -f observability/opentelemetry/values.yaml

   # Prometheus + SLO/SLI
   kubectl apply -f monitoring/slo-sli/prometheus-rules.yaml
   ```

6. **Install reliability components**:
   ```bash
   # Litmus Chaos Engineering
   cd chaos-engineering/litmus
   ./install-litmus.sh 3.0.0

   # Velero Backup & DR
   cd ../../backup-dr/velero
   ./install-velero.sh v1.12.0 us-east-1 docuthinker-velero-backups

   # Flagger Progressive Delivery
   helm install flagger flagger/flagger \
     -n istio-system -f progressive-delivery/flagger/values.yaml
   ```

7. **Install autoscaling & security**:
   ```bash
   # KEDA Event-Driven Autoscaling
   helm install keda kedacore/keda \
     -n keda --create-namespace -f autoscaling/keda/values.yaml

   # Falco Runtime Security
   helm install falco falcosecurity/falco \
     -n falco --create-namespace -f security/falco/values.yaml
   ```

---

## Service Mesh - Istio

### Overview

Istio provides:
- **Automatic mTLS**: 100% of service-to-service traffic encrypted
- **Traffic Management**: Canary deployments, A/B testing, traffic mirroring
- **Circuit Breaking**: Automatic failure isolation
- **Retry Logic**: Configurable retry attempts with timeouts
- **Distributed Tracing**: 100% sampling rate with Jaeger
- **Service Mesh Visualization**: Kiali dashboard

### Architecture

```mermaid
graph LR
    subgraph "Istio Components"
        ISTIOD[Istiod<br/>Control Plane<br/>3 Replicas]

        subgraph "Gateways"
            IG[Ingress Gateway<br/>3 Replicas<br/>LoadBalancer]
            EG[Egress Gateway<br/>2 Replicas<br/>ClusterIP]
        end

        subgraph "Sidecars"
            ENVOY1[Envoy Proxy 1]
            ENVOY2[Envoy Proxy 2]
            ENVOY3[Envoy Proxy 3]
        end

        subgraph "Config"
            VS[Virtual Services<br/>Routing Rules]
            DR[Destination Rules<br/>Circuit Breaking]
            PA[Peer Authentication<br/>Strict mTLS]
            AP[Authorization Policies<br/>RBAC]
        end

        subgraph "Observability"
            KIALI[Kiali UI]
            JAEGER_UI[Jaeger UI]
        end
    end

    INTERNET[Internet] --> IG
    IG --> ENVOY1
    ENVOY1 <-->|mTLS| ENVOY2
    ENVOY2 <-->|mTLS| ENVOY3
    ENVOY3 --> EG
    EG --> EXTERNAL[External APIs]

    ISTIOD -.->|Config| IG & EG & ENVOY1 & ENVOY2 & ENVOY3
    VS & DR & PA & AP -.->|Apply| ENVOY1 & ENVOY2

    ENVOY1 -.->|Metrics| KIALI
    ENVOY1 -.->|Traces| JAEGER_UI

    style ISTIOD fill:#FF6B6B,color:#fff
    style IG fill:#4ECDC4,color:#fff
```

### Installation

```bash
cd service-mesh/istio
./install-istio.sh docuthinker-prod production
```

### Key Features

**1. Canary Deployment (10% traffic split)**:
```yaml
# Configured in traffic-management/virtual-services.yaml
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

**2. Circuit Breaking**:
```yaml
# Configured in traffic-management/destination-rules.yaml
outlierDetection:
  consecutive5xxErrors: 3
  interval: 10s
  baseEjectionTime: 60s
  maxEjectionPercent: 30
```

**3. Retry Logic**:
```yaml
retries:
  attempts: 3
  perTryTimeout: 2s
  retryOn: 5xx,reset,connect-failure
```

### Access Dashboards

```bash
# Kiali (Service Mesh Visualization)
kubectl port-forward svc/kiali -n istio-system 20001:20001
# Open: http://localhost:20001

# Jaeger (Distributed Tracing)
kubectl port-forward svc/jaeger-query -n istio-system 16686:16686
# Open: http://localhost:16686
```

---

## Policy Enforcement - OPA

### Overview

OPA Gatekeeper enforces:
- **10 Security Policies**: Block privileged containers, enforce resource limits, etc.
- **8 Auto-Mutations**: Automatically add defaults (labels, resource limits, security contexts)
- **Continuous Audit**: Scan existing resources for violations
- **Admission Control**: Validate resources before creation

### Policy Enforcement Flow

```mermaid
sequenceDiagram
    participant Dev
    participant K8s API
    participant OPA
    participant Policies
    participant Pod

    Dev->>K8s API: kubectl apply deployment.yaml
    K8s API->>OPA: Admission Request

    OPA->>Policies: Evaluate Constraints

    alt Violations Found
        Policies->>OPA: Deny: Missing labels, no resource limits
        OPA->>K8s API: Admission Denied
        K8s API->>Dev: Error: Policy violations
    else Policies Satisfied
        Policies->>OPA: All policies met
        OPA->>OPA: Apply Mutations (add defaults)
        OPA->>K8s API: Admission Allowed (modified)
        K8s API->>Pod: Create Pod
        Pod->>Dev: Success
    end

    Note over OPA: Continuous Audit (every hour)
    OPA->>Policies: Scan existing resources
    Policies-->>OPA: Report violations
```

### Installation

```bash
cd policy-as-code/opa
./install-opa.sh 3.14.0
```

### Active Policies

1. ✅ Block privileged containers
2. ✅ Enforce non-root users
3. ✅ Require resource limits (CPU/Memory)
4. ✅ Block `:latest` image tags
5. ✅ Enforce trusted registries
6. ✅ Block host namespaces
7. ✅ Require standard labels (app, version, environment, team)
8. ✅ Require read-only root filesystem
9. ✅ Enforce minimum replica counts (2 for prod)
10. ✅ Validate image pull policies

### View Violations

```bash
# List all constraints
kubectl get constraints

# View violations
kubectl get k8srequiredlabels pod-must-have-labels -o yaml

# Test deployment
kubectl apply --dry-run=server -f deployment.yaml
```

---

## CI/CD Pipelines

### Enhanced Pipeline Architecture

```mermaid
graph LR
    subgraph "11-Stage Pipeline"
        GIT[Git Push]

        PRE[Pre-Check<br/>Lint + Audit]
        BUILD[Build<br/>FE + BE + AI]
        TEST[Test<br/>Unit + Coverage]
        SECURITY[Security<br/>Trivy + SonarQube]
        PACKAGE[Package<br/>Docker Build]

        DEPLOY_DEV[Deploy Dev<br/>Auto]
        DEPLOY_STG[Deploy Staging<br/>Manual]
        CANARY[Deploy Canary<br/>Flagger]
        PROMOTE[Promote Prod<br/>Manual Approval]

        POST[Post-Deploy<br/>Smoke + Perf Tests]
        CLEANUP[Cleanup<br/>Old Images]
    end

    GIT --> PRE
    PRE --> BUILD
    BUILD --> TEST
    TEST --> SECURITY
    SECURITY --> PACKAGE

    PACKAGE --> DEPLOY_DEV
    DEPLOY_DEV --> DEPLOY_STG
    DEPLOY_STG --> CANARY
    CANARY -.->|Metrics OK| PROMOTE
    CANARY -.->|Metrics Fail| ROLLBACK[Auto Rollback]

    PROMOTE --> POST
    POST --> CLEANUP
```

### GitLab CI Configuration

```yaml
# .gitlab-ci.yml (11 stages)
stages:
  - pre-check
  - build
  - test
  - security
  - package
  - deploy-dev
  - deploy-staging
  - deploy-canary
  - deploy-production
  - post-deploy
  - cleanup
```

---

## Kubernetes Deployments

### Deployment Flow with Progressive Delivery

```mermaid
flowchart TD
    START([Start]) --> ENV{Environment?}

    ENV -->|Dev| DEV_DEPLOY[Auto-Deploy to Dev]
    ENV -->|Staging| STG_APPROVAL{Manual Approval?}
    ENV -->|Production| PROD_PREP[Prepare Prod Canary]

    STG_APPROVAL -->|Yes| STG_DEPLOY[Deploy to Staging]
    STG_APPROVAL -->|No| CANCEL([Cancelled])

    DEV_DEPLOY --> SMOKE_DEV[Smoke Tests]
    SMOKE_DEV --> SUCCESS_DEV([Dev Deployed])

    STG_DEPLOY --> SMOKE_STG[Smoke Tests]
    SMOKE_STG --> SUCCESS_STG([Staging Deployed])

    PROD_PREP --> FLAGGER[Flagger Canary Analysis]
    FLAGGER --> CANARY_INIT[Initialize 0% Traffic]
    CANARY_INIT --> RAMP[Progressive Ramp 10→50%]

    RAMP --> ANALYSIS{Metrics OK?}
    ANALYSIS -->|Success Rate >99%<br/>Latency <500ms| PROMOTE[Promote to 100%]
    ANALYSIS -->|Metrics Fail| AUTO_RB[Automatic Rollback]

    PROMOTE --> FINAL_SMOKE[Final Smoke Tests]
    AUTO_RB --> ALERT[Send Alert]

    FINAL_SMOKE --> SUCCESS_PROD([Production Deployed])
    ALERT --> FAIL([Deployment Failed])

    style PROMOTE fill:#6BCB77,color:#fff
    style AUTO_RB fill:#FF6B6B,color:#fff
    style SUCCESS_PROD fill:#6BCB77,color:#fff
```

### Deploy Commands

```bash
# Deploy via script
./scripts/deploy/deploy.sh [dev|staging|production]

# Deploy via Helm
helm upgrade --install docuthinker ./helm/docuthinker \
  -f ./helm/docuthinker/values-prod.yaml \
  -n docuthinker-prod

# Rollback
./scripts/deploy/rollback.sh production 3
```

---

## Progressive Delivery - Flagger

### Overview

Flagger automates canary deployments with metric-based promotion/rollback.

**Features**:
- Progressive traffic shifting (10% → 50%)
- Prometheus metrics analysis
- Success rate threshold (>99%)
- Latency threshold (<500ms)
- Automatic rollback on failure
- Slack notifications

### Canary Deployment Process

```mermaid
graph TB
    START[New Deployment] --> INIT[Flagger Detects Change]
    INIT --> CREATE[Create Canary Deployment]
    CREATE --> ROUTE_0[Route 0% Traffic to Canary]

    ROUTE_0 --> RAMP_10[Ramp to 10%]
    RAMP_10 --> ANALYZE_10{Analyze Metrics<br/>1 minute}

    ANALYZE_10 -->|Pass| RAMP_20[Ramp to 20%]
    ANALYZE_10 -->|Fail| ROLLBACK[Automatic Rollback]

    RAMP_20 --> ANALYZE_20{Analyze Metrics}
    ANALYZE_20 -->|Pass| RAMP_50[Ramp to 50%]
    ANALYZE_20 -->|Fail| ROLLBACK

    RAMP_50 --> ANALYZE_50{Analyze Metrics}
    ANALYZE_50 -->|Pass| PROMOTE[Promote to 100%]
    ANALYZE_50 -->|Fail| ROLLBACK

    PROMOTE --> CLEANUP[Delete Canary]
    CLEANUP --> SUCCESS([Deployment Complete])

    ROLLBACK --> ALERT[Send Slack Alert]
    ALERT --> FAIL([Deployment Failed])

    style PROMOTE fill:#6BCB77,color:#fff
    style ROLLBACK fill:#FF6B6B,color:#fff
    style SUCCESS fill:#6BCB77,color:#fff
```

### Installation

```bash
helm install flagger flagger/flagger \
  -n istio-system \
  -f progressive-delivery/flagger/values.yaml
```

### Example Canary Configuration

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: backend
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
    - name: request-duration
      thresholdRange:
        max: 500
```

---

## Monitoring & Observability

### Complete Observability Stack

```mermaid
graph TB
    subgraph "Applications"
        APP[Applications<br/>Frontend + Backend]
    end

    subgraph "Collection"
        OTEL[OpenTelemetry Collector<br/>3 Replicas HA]
        PROM_EXP[Prometheus Exporters]
        FILEBEAT[Filebeat]
    end

    subgraph "Storage & Processing"
        subgraph "Traces"
            JAEGER[Jaeger]
            ES_TRACE[(Elasticsearch)]
        end

        subgraph "Metrics"
            PROM[Prometheus]
            SLO_CALC[SLO/SLI Calculator]
            ERROR_BUDGET[Error Budget]
        end

        subgraph "Logs"
            LOGSTASH[Logstash]
            ES_LOG[(Elasticsearch)]
        end
    end

    subgraph "Visualization"
        GRAF[Grafana<br/>Unified Dashboards]
        KIBANA[Kibana<br/>Log Analysis]
        KIALI[Kiali<br/>Service Mesh]
    end

    subgraph "Alerting"
        ALERT[AlertManager]
        SLACK[Slack]
        PD[PagerDuty]
    end

    APP -->|OTLP| OTEL
    APP -->|Metrics| PROM_EXP
    APP -->|Logs| FILEBEAT

    OTEL --> JAEGER
    JAEGER --> ES_TRACE

    PROM_EXP --> PROM
    PROM --> SLO_CALC
    SLO_CALC --> ERROR_BUDGET

    FILEBEAT --> LOGSTASH
    LOGSTASH --> ES_LOG

    PROM --> GRAF
    JAEGER --> GRAF
    ES_LOG --> KIBANA
    PROM --> KIALI

    PROM -.->|Alerts| ALERT
    ALERT --> SLACK
    ALERT -->|Critical| PD

    style OTEL fill:#F38181,color:#fff
    style PROM fill:#E85D04,color:#fff
    style GRAF fill:#F48C06,color:#fff
    style SLO_CALC fill:#95E1D3
```

### SLO/SLI Monitoring

**Service Level Objectives**:
- Availability > 99.9%
- P99 Latency < 500ms
- Error Rate < 0.1%

**Prometheus Recording Rules**:
```promql
# Availability SLI
sli:availability:ratio_rate30d >= 0.999

# Latency SLI
sli:latency:p99_5m <= 0.5

# Error Budget
slo:error_budget:remaining
```

**Alerts**:
- Fast burn: >14.4x rate (error budget exhausted in 6 hours)
- Slow burn: >1x rate (gradual degradation)
- SLO violation: Availability < 99.9%

### Access Dashboards

```bash
# Grafana (Metrics + SLO/SLI)
kubectl port-forward svc/grafana -n monitoring 3000:80
# Open: http://localhost:3000

# Prometheus (Raw Metrics)
kubectl port-forward svc/prometheus -n monitoring 9090:9090
# Open: http://localhost:9090

# Kibana (Logs)
kubectl port-forward svc/kibana -n monitoring 5601:5601
# Open: http://localhost:5601

# Kiali (Service Mesh)
kubectl port-forward svc/kiali -n istio-system 20001:20001
# Open: http://localhost:20001
```

---

## Chaos Engineering - Litmus

### Overview

Litmus validates system resilience through controlled chaos experiments.

**Available Experiments**:
1. Pod Deletion (50% of pods, 60s)
2. Network Latency (2000ms injection)
3. CPU Stress (100% load, 1 core)
4. Memory Stress (500MB consumption)
5. Node Drain
6. Container Kill

### Installation

```bash
cd chaos-engineering/litmus
./install-litmus.sh 3.0.0
```

### Run Chaos Experiments

```bash
# Pod deletion test
kubectl apply -f chaos-engineering/litmus/experiments/pod-delete-experiment.yaml

# Network latency test
kubectl apply -f chaos-engineering/litmus/experiments/network-latency-experiment.yaml

# Resource stress test
kubectl apply -f chaos-engineering/litmus/experiments/resource-stress-experiment.yaml

# Comprehensive workflow (all experiments sequentially)
kubectl apply -f chaos-engineering/litmus/workflows/comprehensive-chaos-workflow.yaml
```

### Monitor Results

```bash
# Watch chaos engine
kubectl get chaosengine -n docuthinker-prod -w

# View results
kubectl describe chaosresult backend-pod-delete -n docuthinker-prod

# Access ChaosCenter UI
kubectl port-forward svc/chaos-litmus-frontend-service -n litmus 9091:9091
# Open: http://localhost:9091
```

---

## Disaster Recovery - Velero

### Overview

Velero provides automated backup and disaster recovery:
- **Daily full backups** (30-day retention)
- **Hourly incremental backups** (7-day retention)
- **RTO < 1 hour**
- **S3 backend storage**
- **EBS volume snapshots**

### Installation

```bash
cd backup-dr/velero
./install-velero.sh v1.12.0 us-east-1 docuthinker-velero-backups
```

### Backup Operations

```bash
# Create manual backup
velero backup create prod-backup-$(date +%Y%m%d) \
  --include-namespaces docuthinker-prod

# List backups
velero backup get

# Describe backup
velero backup describe prod-backup-20250127

# View backup logs
velero backup logs prod-backup-20250127
```

### Restore Operations

```bash
# Restore from backup
velero restore create --from-backup prod-backup-20250127

# Restore specific namespace
velero restore create --from-backup prod-backup-20250127 \
  --include-namespaces docuthinker-prod

# Monitor restore
velero restore get
velero restore describe <restore-name>
```

### Scheduled Backups

Automatically configured:
- **Daily**: 2 AM, 30-day retention
- **Hourly**: Every hour, 7-day retention

---

## Autoscaling - KEDA

### Overview

KEDA provides event-driven autoscaling:
- **Scale to zero** capability
- **AWS SQS** queue-based scaling
- **HTTP** request-based scaling
- **Cron** scheduled scaling
- **Prometheus** custom metrics

### Installation

```bash
helm install keda kedacore/keda \
  -n keda --create-namespace \
  -f autoscaling/keda/values.yaml
```

### Scaler Examples

**1. SQS Queue Scaler** (1-50 replicas):
```yaml
triggers:
- type: aws-sqs-queue
  metadata:
    queueURL: https://sqs.us-east-1.amazonaws.com/.../docuthinker-jobs
    queueLength: "5"
    awsRegion: "us-east-1"
```

**2. HTTP Scaler** (2-20 replicas):
```yaml
triggers:
- type: prometheus
  metadata:
    query: sum(rate(http_requests_total{app="backend"}[1m]))
    threshold: "100"
```

**3. Cron Scaler** (business hours):
```yaml
triggers:
- type: cron
  metadata:
    timezone: America/New_York
    start: 0 8 * * 1-5  # 8 AM weekdays
    end: 0 18 * * 1-5    # 6 PM weekdays
    desiredReplicas: "10"
```

### Apply Scalers

```bash
kubectl apply -f autoscaling/keda/scalers/queue-scaler.yaml
```

---

## Runtime Security - Falco

### Overview

Falco provides runtime threat detection:
- **4 custom security rules**
- **Real-time alerts** (Slack, PagerDuty)
- **eBPF-based** syscall monitoring
- **Anomaly detection**

### Installation

```bash
helm install falco falcosecurity/falco \
  -n falco --create-namespace \
  -f security/falco/values.yaml
```

### Custom Rules

1. **Privilege Escalation** - Detects sudo/su attempts
2. **Sensitive File Access** - Monitors /etc/shadow, SSH keys
3. **Reverse Shell** - Identifies shell attacks
4. **Cryptocurrency Mining** - Detects mining processes

### View Alerts

```bash
# View Falco logs
kubectl logs -l app=falco -n falco -f

# Check for alerts
kubectl logs -l app=falco -n falco | grep -i "warning\|critical"
```

---

## Secret Management

### Architecture

```mermaid
graph TB
    subgraph "Secret Sources"
        VAULT[HashiCorp Vault<br/>HA]
        AWS_SM[AWS Secrets Manager]
    end

    subgraph "Kubernetes"
        ESO[External Secrets Operator]
        K8S_SECRET[Kubernetes Secrets]
    end

    subgraph "Applications"
        POD[Application Pods]
    end

    VAULT -.->|Pull| ESO
    AWS_SM -.->|Pull| ESO
    ESO --> K8S_SECRET
    K8S_SECRET -->|Mount| POD

    style VAULT fill:#AA96DA,color:#fff
    style ESO fill:#6BCB77,color:#fff
```

### HashiCorp Vault

```bash
# Install Vault
helm install vault hashicorp/vault \
  -n vault -f secrets/vault/vault-values.yaml

# Initialize Vault
./secrets/vault/init-vault.sh

# Access UI
kubectl port-forward svc/vault -n vault 8200:8200
# Open: http://localhost:8200
```

### External Secrets Operator

```bash
# Apply secret store
kubectl apply -f secrets/external-secrets/secret-store.yaml

# Secrets are automatically synced from Vault/AWS to K8s
```

---

## Performance Testing

### K6 Load Testing

**6 Test Scenarios**:
1. **Baseline** (10 VUs, 5min) - Establish normal performance
2. **Load Test** (0→50 VUs, 14min) - Sustained load
3. **Stress Test** (0→300 VUs, 26min) - Find breaking point
4. **Spike Test** (0→500 VUs, 1.5min) - Sudden surge
5. **Soak Test** (50 VUs, 2h) - Extended duration
6. **Breakpoint** (1→500 req/s, 22min) - Gradual increase to failure

### Run Load Tests

```bash
# Basic load test
k6 run --vus 100 --duration 5m testing/load-tests/k6-advanced-scenarios.js

# With custom endpoint
BASE_URL=https://staging.docuthinker.com k6 run testing/load-tests/k6-advanced-scenarios.js

# All scenarios
k6 run testing/load-tests/k6-advanced-scenarios.js
```

### Test Thresholds

- P95 latency < 500ms
- P99 latency < 1000ms
- Error rate < 1%
- Success rate > 95%

---

## Database Migrations

### Flyway Overview

Flyway provides version-controlled database migrations:
- **Versioned SQL scripts**
- **Rollback support**
- **Validation on deploy**
- **Baseline on migrate**

### Migration Structure

```
database/migrations/
├── flyway.conf               # Configuration
└── sql/
    ├── V1__initial_schema.sql
    ├── V2__add_api_keys.sql
    └── V3__add_audit_log.sql
```

### Run Migrations

```bash
# Via Flyway CLI
flyway -configFiles=database/migrations/flyway.conf migrate

# Via Docker
docker run --rm \
  -v $(pwd)/database/migrations:/flyway/sql \
  flyway/flyway migrate

# Rollback (if supported)
flyway -configFiles=database/migrations/flyway.conf undo
```

---

## Infrastructure Testing

### Terratest

Validate Terraform infrastructure with automated tests.

**Tests Included**:
- VPC configuration validation
- EKS cluster verification
- RDS database connectivity
- S3 bucket existence and versioning
- Security group rules
- IAM roles and policies
- CloudWatch log groups
- Resource tagging compliance

### Run Tests

```bash
cd testing/infrastructure

# Run all tests
go test -v -timeout 30m

# Run specific test
go test -v -run TestTerraformDocuThinkerInfrastructure

# Parallel execution
go test -v -parallel 4
```

---

## Security

### Multi-Layered Security

```mermaid
graph TB
    L1[Layer 1: Network<br/>WAF + TLS + mTLS]
    L2[Layer 2: Admission<br/>OPA Gatekeeper]
    L3[Layer 3: Authentication<br/>Firebase + JWT + RBAC]
    L4[Layer 4: Runtime<br/>Falco Monitoring]
    L5[Layer 5: Secrets<br/>Vault + Secrets Manager]
    L6[Layer 6: Data<br/>Encryption at Rest/Transit]
    L7[Layer 7: Audit<br/>Logs + Compliance]

    L1 --> L2 --> L3 --> L4 --> L5 --> L6 --> L7

    style L1 fill:#FF6B6B,color:#fff
    style L2 fill:#4ECDC4,color:#fff
    style L4 fill:#F38181,color:#fff
    style L5 fill:#AA96DA,color:#fff
```

### Security Scanning

```bash
# Trivy image scanning
./scripts/security/trivy-scan.sh

# SonarQube analysis
sonar-scanner -Dproject.settings=scripts/security/sonarqube.properties

# OPA policy violations
kubectl get constraints -o json | jq '.items[].status.violations'

# Falco alerts
kubectl logs -l app=falco -n falco | grep -i critical
```

---

## Troubleshooting

### Common Issues

**1. Pod not starting**:
```bash
kubectl describe pod <pod-name> -n docuthinker-prod
kubectl logs <pod-name> -n docuthinker-prod
kubectl logs <pod-name> -c istio-proxy -n docuthinker-prod
```

**2. OPA blocking deployment**:
```bash
# Check violations
kubectl get constraints

# Test deployment
kubectl apply --dry-run=server -f deployment.yaml

# View specific constraint
kubectl get k8srequiredlabels pod-must-have-labels -o yaml
```

**3. Istio traffic issues**:
```bash
# Check virtual services
kubectl get virtualservices -n docuthinker-prod

# Check destination rules
kubectl get destinationrules -n docuthinker-prod

# Analyze configuration
istioctl analyze -n docuthinker-prod

# View proxy logs
kubectl logs <pod-name> -c istio-proxy
```

**4. Canary not promoting**:
```bash
# Check Flagger status
kubectl describe canary backend -n docuthinker-prod

# View Flagger logs
kubectl logs -l app=flagger -n istio-system

# Check metrics
kubectl port-forward svc/prometheus -n monitoring 9090:9090
# Query: flagger_canary_status
```

**5. High error rate**:
```bash
# Check SLO/SLI metrics
kubectl port-forward svc/prometheus -n monitoring 9090:9090
# Query: sli:availability:ratio_rate5m

# View error budget
# Query: slo:error_budget:remaining

# Check application logs
kubectl logs -l app=backend -n docuthinker-prod | grep -i error
```

### Rollback Procedures

```bash
# View deployment history
helm history docuthinker -n docuthinker-prod

# Rollback to previous version
./scripts/deploy/rollback.sh production

# Rollback to specific revision
helm rollback docuthinker 3 -n docuthinker-prod

# Emergency rollback (bypass Flagger)
kubectl rollout undo deployment/backend -n docuthinker-prod
```

---

## Maintenance Schedule

**Daily**:
- Monitor SLO/SLI dashboards
- Review error budgets
- Check Falco security alerts
- Review OPA violations

**Weekly**:
- Run chaos experiments
- Review Velero backup status
- Update dependencies
- Review cost optimization (Kubecost)
- Security scans (Trivy + SonarQube)

**Monthly**:
- DR drill (test Velero restore)
- Performance review (K6 load tests)
- Infrastructure testing (Terratest)
- Update documentation
- Security audit
- Cost optimization review

---

## Quick Reference

### Common Commands

```bash
# === Deployment ===
./scripts/deploy/deploy.sh [dev|staging|production]
./scripts/deploy/rollback.sh [environment] [revision]

# === Monitoring ===
kubectl port-forward svc/grafana -n monitoring 3000:80
kubectl port-forward svc/prometheus -n monitoring 9090:9090
kubectl port-forward svc/kiali -n istio-system 20001:20001

# === Chaos Engineering ===
kubectl apply -f chaos-engineering/litmus/experiments/pod-delete-experiment.yaml
kubectl get chaosresult -n docuthinker-prod

# === Backup & Restore ===
velero backup create prod-backup-$(date +%Y%m%d) --include-namespaces docuthinker-prod
velero restore create --from-backup prod-backup-20250127

# === Security ===
./scripts/security/trivy-scan.sh
kubectl get constraints
kubectl logs -l app=falco -n falco

# === Load Testing ===
k6 run --vus 100 --duration 5m testing/load-tests/k6-advanced-scenarios.js

# === Logs ===
kubectl logs -l app=backend -n docuthinker-prod -f
kubectl logs -l app=backend -c istio-proxy -n docuthinker-prod
```

---

## Support

For issues:
1. Check this documentation
2. Review component-specific READMEs
3. Check logs and metrics
4. Review troubleshooting section
5. Contact DevOps team

## Documentation

- [DEVOPS_QUICK_START.md](DEVOPS_QUICK_START.md) - Installation guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

---
