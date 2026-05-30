# Coralogix Observability Integration

Production-grade Coralogix integration for DocuThinker providing unified logs, metrics, and traces.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     DocuThinker Cluster                          │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │ Frontend  │  │ Backend  │  │  AI/ML   │  │   Orchestrator   ││
│  │  Pods     │  │  Pods    │  │  Pods    │  │     Pods         ││
│  └────┬──┬──┘  └────┬──┬──┘  └────┬──┬──┘  └──────┬──┬───────┘│
│       │  │          │  │          │  │              │  │        │
│   logs│  │traces    │  │       logs│  │          logs│  │traces │
│       │  │  metrics │  │          │  │              │  │metrics │
│       ▼  ▼          ▼  ▼          ▼  ▼              ▼  ▼        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │          OpenTelemetry Collector (Gateway)                  ││
│  │  Receivers: OTLP gRPC/HTTP, Jaeger, Zipkin, Prometheus     ││
│  │  Processors: batch, memory_limiter, k8s attributes         ││
│  │  Exporters: Coralogix OTLP, Jaeger, Prometheus             ││
│  └──────────────────────┬──────────────────────────────────────┘│
│                         │                                       │
│  ┌──────────────────────┼──────────────────────────────────────┐│
│  │  Fluent Bit DaemonSet│(Node-level log collection)          ││
│  │  /var/log/containers/ → parse → enrich → Coralogix         ││
│  └──────────────────────┼──────────────────────────────────────┘│
│                         │                                       │
│  ┌──────────────────────┼──────────────────────────────────────┐│
│  │  Prometheus Remote Write → Coralogix (metrics correlation) ││
│  └──────────────────────┼──────────────────────────────────────┘│
└─────────────────────────┼───────────────────────────────────────┘
                          │ OTLP/gRPC (TLS)
                          ▼
              ┌───────────────────────┐
              │   Coralogix SaaS      │
              │  ┌─────────────────┐  │
              │  │ Logs            │  │
              │  │ Metrics         │  │
              │  │ Traces          │  │
              │  │ Alerts          │  │
              │  │ Dashboards      │  │
              │  │ Recording Rules │  │
              │  │ TCO Policies    │  │
              │  │ S3 Archive      │  │
              │  └─────────────────┘  │
              └───────────────────────┘
```

## Components

| Component | Config File | Purpose |
|-----------|-------------|---------|
| Coralogix K8s Integration | `values.yaml` | OTel DaemonSet + Cluster Collector |
| Fluent Bit | `fluent-bit-values.yaml` | Node-level log collection |
| Alerts | `alerts.yaml` | 12 Coralogix-native alert rules |
| Recording Rules | `recording-rules.yaml` | Pre-aggregated metrics + TCO policies |
| Network Policies | `network-policy.yaml` | Egress rules for Coralogix endpoints |
| Dashboards | `dashboards/` | Custom Coralogix dashboard configs |
| Terraform Module | `terraform/modules/coralogix/` | IaC for alerts, TCO, recording rules |

## Deployment

### Prerequisites

1. **Coralogix Account** with a Send-Your-Data API key
2. **Vault/AWS Secrets Manager** configured with Coralogix credentials at `docuthinker/coralogix/credentials`
3. **Helm 3.x** and `kubectl` configured

### Install Coralogix Integration

```bash
# Add Coralogix Helm repo
helm repo add coralogix https://cgx.jfrog.io/artifactory/coralogix-charts-virtual
helm repo update

# Create namespace
kubectl create namespace monitoring

# Deploy Coralogix integration (OTel Agent + Cluster Collector)
helm upgrade --install coralogix-integration coralogix/coralogix-integration \
  --namespace monitoring \
  -f monitoring/coralogix/values.yaml

# Deploy Fluent Bit for log collection
helm upgrade --install fluent-bit fluent/fluent-bit \
  --namespace monitoring \
  -f monitoring/coralogix/fluent-bit-values.yaml

# Apply network policies
kubectl apply -f monitoring/coralogix/network-policy.yaml

# Apply alert definitions
kubectl apply -f monitoring/coralogix/alerts.yaml

# Apply recording rules
kubectl apply -f monitoring/coralogix/recording-rules.yaml
```

### Terraform Deployment

```bash
cd terraform

# Initialize with Coralogix provider
terraform init

# Plan Coralogix resources
terraform plan -target=module.coralogix

# Apply
terraform apply -target=module.coralogix
```

### Required Secrets

Store in Vault at `docuthinker/coralogix/credentials`:

| Key | Description |
|-----|-------------|
| `private_key` | Coralogix Send-Your-Data API key |
| `logs_query_key` | Coralogix Logs Query key (for Grafana) |

### Terraform Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `coralogix_api_key` | Send-Your-Data API key | — (required) |
| `coralogix_domain` | Coralogix domain | `coralogix.com` |
| `slack_critical_webhook_url` | Slack webhook for critical alerts | `""` |
| `slack_alerts_webhook_url` | Slack webhook for general alerts | `""` |
| `pagerduty_service_key` | PagerDuty service key | `""` |

## TCO Optimization

Coralogix TCO policies control data ingestion tiers to optimize costs:

| Tier | Data Type | Retention | Cost |
|------|-----------|-----------|------|
| **Frequent Search** | Errors, critical logs, error spans | Full indexing | Highest |
| **Monitoring** | Warnings, info logs, normal spans | Monitoring index | Medium |
| **Compliance** | Debug, K8s infra logs | Archive only | Lowest |
| **Block** | Health check logs | Dropped | Free |

## Alerts

12 production alerts configured:

| Alert | Severity | Condition |
|-------|----------|-----------|
| High Error Rate | Critical | 5xx rate > 5% for 5m |
| High P95 Latency | Warning | P95 > 1s for 5m |
| Pod CrashLooping | Critical | > 3 restarts in 15m |
| High Memory Usage | Warning | > 90% of limit for 5m |
| High CPU Usage | Warning | > 90% of limit for 5m |
| DB Pool Exhausted | Critical | > 90% usage for 2m |
| API Endpoint Down | Critical | Backend down for 1m |
| Error Budget Fast Burn | Critical | Burn rate > 14.4x |
| Node Not Ready | Critical | Node unready for 5m |
| Disk Space Low | Critical | < 10% remaining |
| SLO Violation | Critical | Availability < 99.9% |
| Redis High Memory | Warning | > 90% of max |

## Grafana Integration

Coralogix is configured as a Grafana datasource for unified dashboarding:

- **Coralogix Metrics** — Prometheus-compatible query endpoint
- **Coralogix Logs** — Native log query datasource
- **Coralogix Traces** — Jaeger-compatible trace datasource
