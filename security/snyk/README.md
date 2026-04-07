# Snyk — Vulnerability Management & Security Scanning

Production-grade Snyk integration for DocuThinker covering open source dependencies, container images, Infrastructure as Code, and SAST code analysis.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│ CI Pipeline (GitLab CI / Jenkins)                                  │
│                                                                    │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ snyk test    │ │ snyk container│ │ snyk iac │ │ snyk code   │ │
│  │ (OSS deps)   │ │ test (images) │ │ test     │ │ test (SAST) │ │
│  └──────┬───────┘ └──────┬────────┘ └────┬─────┘ └──────┬──────┘ │
│         └────────────────┴───────────────┴───────────────┘        │
│                              │                                     │
└──────────────────────────────┼─────────────────────────────────────┘
                               │ HTTPS
                               ▼
                   ┌───────────────────────┐
                   │    Snyk Platform      │
                   │                       │
                   │  Vulnerability DB     │
                   │  License Compliance   │
                   │  Fix PRs              │
                   │  Continuous Monitor   │
                   └───────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ Kubernetes Cluster                                                 │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Snyk Controller (snyk-monitor)                               │ │
│  │ Continuously scans running container images in-cluster       │ │
│  │ Monitors: docuthinker-prod, docuthinker-staging, monitoring  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## Scan Types

| Scan | Command | What It Covers |
|------|---------|----------------|
| **Open Source** | `snyk test` | npm, pip dependency vulnerabilities |
| **Container** | `snyk container test` | Docker image OS + app layer vulns |
| **IaC** | `snyk iac test` | Terraform, K8s, Helm misconfigurations |
| **Code (SAST)** | `snyk code test` | Source code security issues |
| **K8s Monitor** | Snyk Controller | Running workload image scanning |

## Components

| File | Purpose |
|------|---------|
| `.snyk` (root) | Global policy: ignore rules, severity thresholds |
| `security/snyk/values.yaml` | Helm values for Snyk K8s Controller |
| `security/snyk/iac-config.yaml` | IaC scanning targets + custom rules |
| `security/snyk/container-policy.yaml` | Container image scanning policy + license rules |
| `scripts/security/scan-all.sh` | Local scan script (SonarQube + all Snyk scans) |

## Container Policy Highlights

- **Max critical vulns**: 0 (hard fail)
- **Max high vulns**: 5 per image (Node.js), 10 (Python)
- **Banned base images**: `ubuntu:latest`, `debian:latest`, `centos:*`, `node:latest`
- **Allowed licenses**: MIT, Apache-2.0, BSD-2/3, ISC, Unlicense
- **Banned licenses**: GPL-3.0, AGPL-3.0, SSPL-1.0

## Deployment

```bash
# Deploy Snyk K8s Controller
helm repo add snyk https://snyk.github.io/kubernetes-monitor
helm repo update

helm upgrade --install snyk-monitor snyk/snyk-monitor \
  --namespace monitoring \
  -f security/snyk/values.yaml

# Run local scans
export SNYK_TOKEN="your-token"
./scripts/security/scan-all.sh --snyk

# Run all security scans (SonarQube + Snyk)
./scripts/security/scan-all.sh --all
```

## Required Vault Secrets

| Path | Key | Description |
|------|-----|-------------|
| `docuthinker/snyk/credentials` | `api_token` | Snyk API token |
| `docuthinker/snyk/credentials` | `org_id` | Snyk organization ID |
