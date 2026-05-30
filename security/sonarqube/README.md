# SonarQube — Code Quality & Security Analysis

Production-grade SonarQube integration for DocuThinker covering static analysis, code coverage, security vulnerabilities, and quality gates across all 4 service modules.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ CI Pipeline (GitLab CI / Jenkins)                       │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌────────────┐ ┌───────────┐ │
│  │Frontend │ │Backend  │ │Orchestrator│ │  AI/ML    │ │
│  │ tests   │ │ tests   │ │   tests    │ │  tests    │ │
│  └────┬────┘ └────┬────┘ └─────┬──────┘ └─────┬─────┘ │
│       │           │            │               │       │
│       └───────────┴────────────┴───────────────┘       │
│                         │                               │
│              sonar-scanner CLI                          │
│              (sonar-project.properties)                 │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS
                          ▼
              ┌───────────────────────┐
              │   SonarQube Server    │
              │   (K8s / Enterprise)  │
              │                       │
              │  Quality Gate ─────── │──▶ Pass/Fail
              │  Quality Profiles     │
              │  Security Hotspots    │
              │  Code Coverage        │
              │  Duplication          │
              │  PostgreSQL Backend   │
              └───────────────────────┘
```

## Components

| File | Purpose |
|------|---------|
| `sonar-project.properties` (root) | Multi-module scanner config for all 4 services |
| `security/sonarqube/values.yaml` | Helm values for SonarQube K8s deployment |
| `security/sonarqube/quality-gate.json` | Quality gate definition (14 conditions) |
| `security/sonarqube/quality-profiles.json` | Custom profiles for JS/TS/Python |

## Quality Gate — "DocuThinker Production"

| Condition | Threshold | Scope |
|-----------|-----------|-------|
| Reliability Rating | A | New Code |
| Security Rating | A | New Code |
| Maintainability Rating | A | New Code |
| Security Hotspots Reviewed | 100% | New Code |
| Coverage | ≥ 70% | New Code |
| Duplicated Lines | ≤ 3% | New Code |
| Blocker Issues | 0 | New Code |
| Critical Issues | 0 | New Code |
| Vulnerabilities | 0 | New Code |
| Bugs | 0 | New Code |
| Code Smells | ≤ 50 | New Code |
| Overall Reliability | ≤ C | Overall |
| Overall Security | ≤ B | Overall |
| Overall Maintainability | ≤ C | Overall |

## Deployment

```bash
# Deploy SonarQube to Kubernetes
helm repo add sonarqube https://SonarSource.github.io/helm-chart-sonarqube
helm repo update

helm upgrade --install sonarqube sonarqube/sonarqube \
  --namespace security --create-namespace \
  -f security/sonarqube/values.yaml

# Run local scan
export SONAR_TOKEN="your-token"
sonar-scanner -Dsonar.host.url=https://sonarqube.docuthinker.com
```

## Required Vault Secrets

| Path | Key | Description |
|------|-----|-------------|
| `docuthinker/sonarqube/database` | `admin_password` | PostgreSQL admin password |
| `docuthinker/sonarqube/database` | `password` | SonarQube DB user password |
| `docuthinker/sonarqube/credentials` | `api_token` | Scanner authentication token |
