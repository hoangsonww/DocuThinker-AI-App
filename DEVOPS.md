# DocuThinker DevOps Documentation

Comprehensive guide for deploying, monitoring, and maintaining DocuThinker infrastructure.

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Getting Started](#getting-started)
3. [CI/CD Pipelines](#cicd-pipelines)
4. [Kubernetes Deployments](#kubernetes-deployments)
5. [Monitoring & Observability](#monitoring--observability)
6. [Secret Management](#secret-management)
7. [Performance Testing](#performance-testing)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)

## Infrastructure Overview

DocuThinker uses a modern cloud-native architecture:

- **Cloud Provider**: AWS
- **Container Orchestration**: Amazon EKS (Kubernetes)
- **Infrastructure as Code**: Terraform
- **CI/CD**: GitLab CI / CircleCI / Jenkins
- **Monitoring**: Prometheus + Grafana + ELK Stack
- **Secret Management**: HashiCorp Vault + AWS Secrets Manager
- **GitOps**: ArgoCD
- **Performance Testing**: k6

### Architecture Diagram

```mermaid
graph TB
    subgraph "AWS Cloud"
        subgraph "Edge Layer"
            CF[CloudFront CDN]
            WAF[AWS WAF]
        end

        subgraph "Network Layer"
            ALB[Application Load Balancer]
            IGW[Internet Gateway]
        end

        subgraph "VPC - Multi-AZ"
            subgraph "Public Subnets"
                NAT1[NAT Gateway AZ-1]
                NAT2[NAT Gateway AZ-2]
            end

            subgraph "Private Subnets"
                subgraph "EKS Cluster"
                    subgraph "Frontend Pods"
                        FE1[React Frontend 1]
                        FE2[React Frontend 2]
                        FE3[React Frontend 3]
                    end

                    subgraph "Backend Pods"
                        BE1[Node.js Backend 1]
                        BE2[Node.js Backend 2]
                        BE3[Node.js Backend 3]
                    end

                    subgraph "Monitoring"
                        PROM[Prometheus]
                        GRAF[Grafana]
                        ELK[ELK Stack]
                    end
                end

                subgraph "Data Layer"
                    RDS[(RDS PostgreSQL<br/>Multi-AZ)]
                    REDIS[(ElastiCache Redis)]
                end
            end
        end

        subgraph "Security & Secrets"
            VAULT[HashiCorp Vault]
            SM[AWS Secrets Manager]
        end

        subgraph "Storage"
            S3[S3 Buckets]
        end
    end

    Users -->|HTTPS| CF
    CF --> WAF
    WAF --> ALB
    ALB --> IGW
    IGW --> FE1 & FE2 & FE3
    FE1 & FE2 & FE3 --> BE1 & BE2 & BE3
    BE1 & BE2 & BE3 --> RDS
    BE1 & BE2 & BE3 --> REDIS
    BE1 & BE2 & BE3 --> S3
    BE1 & BE2 & BE3 -.->|Metrics| PROM
    PROM --> GRAF
    BE1 & BE2 & BE3 -.->|Logs| ELK
    BE1 & BE2 & BE3 -.->|Secrets| VAULT
    BE1 & BE2 & BE3 -.->|Secrets| SM

    style CF fill:#FF6B6B
    style ALB fill:#4ECDC4
    style RDS fill:#95E1D3
    style REDIS fill:#F38181
    style VAULT fill:#AA96DA
    style EKS fill:#E8F4F8
```

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

# k6
brew install k6
```

### Initial Setup

1. **Configure AWS credentials**:
   ```bash
   aws configure
   ```

2. **Deploy infrastructure**:
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

4. **Install monitoring stack**:
   ```bash
   ./scripts/setup/install-monitoring.sh
   ```

## CI/CD Pipelines

### Pipeline Architecture

```mermaid
graph LR
    subgraph "Source Control"
        GIT[Git Push]
    end

    subgraph "CI/CD Platform"
        TRIGGER[Webhook Trigger]

        subgraph "Pre-Check Stage"
            LINT[Code Linting]
            AUDIT[Dependency Audit]
        end

        subgraph "Build Stage"
            BFE[Build Frontend]
            BBE[Build Backend]
            BAI[Build AI/ML]
        end

        subgraph "Test Stage"
            TFE[Test Frontend]
            TBE[Test Backend]
            TAI[Test AI/ML]
            COV[Code Coverage]
        end

        subgraph "Security Stage"
            TRIVY[Trivy Scan]
            SONAR[SonarQube Analysis]
            SAST[SAST Checks]
        end

        subgraph "Package Stage"
            DOCKER[Build Docker Images]
            PUSH[Push to Registry]
        end

        subgraph "Deploy Stage"
            DEV[Deploy to Dev]
            STAGING[Deploy to Staging]
            CANARY[Deploy Canary]
            PROD[Promote to Production]
        end

        subgraph "Post-Deploy Stage"
            SMOKE[Smoke Tests]
            PERF[Performance Tests]
            NOTIFY[Notifications]
        end
    end

    GIT --> TRIGGER
    TRIGGER --> LINT & AUDIT
    LINT & AUDIT --> BFE & BBE & BAI
    BFE & BBE & BAI --> TFE & TBE & TAI
    TFE & TBE & TAI --> COV
    COV --> TRIVY & SONAR & SAST
    TRIVY & SONAR & SAST --> DOCKER
    DOCKER --> PUSH
    PUSH --> DEV
    DEV --> STAGING
    STAGING --> CANARY
    CANARY -->|Manual Approval| PROD
    PROD --> SMOKE & PERF
    SMOKE & PERF --> NOTIFY

    style TRIGGER fill:#FFD93D
    style DOCKER fill:#6BCB77
    style PROD fill:#FF6B6B
    style NOTIFY fill:#4D96FF
```

### GitLab CI

Pipeline stages:
1. Pre-check (linting, dependency audit)
2. Build (frontend, backend, AI/ML)
3. Test (unit tests, coverage)
4. Security (Trivy, SonarQube)
5. Package (Docker builds)
6. Deploy (dev → staging → production)
7. Post-deploy (smoke tests, performance tests)

Configuration: `.gitlab-ci.yml`

### CircleCI

Similar pipeline with parallel job execution.

Configuration: `.circleci/config.yml`

### Jenkins

Advanced canary and blue/green deployment strategy.

Configuration: `Jenkinsfile`

### Deployment Strategies

```mermaid
graph TB
    subgraph "Blue/Green Deployment"
        LB1[Load Balancer]
        BLUE1[Blue Environment<br/>Current Version]
        GREEN1[Green Environment<br/>New Version]

        LB1 -->|100% Traffic| BLUE1
        LB1 -.->|0% Traffic| GREEN1
        GREEN1 -.->|Deploy & Test| GREEN1
        GREEN1 -.->|Switch Traffic| LB1
        LB1 -.->|100% Traffic| GREEN1
    end

    subgraph "Canary Deployment"
        LB2[Load Balancer]
        STABLE[Stable Version<br/>90% Traffic]
        CANARY[Canary Version<br/>10% Traffic]

        LB2 -->|90%| STABLE
        LB2 -->|10%| CANARY
        CANARY -->|Monitor Metrics| DECISION{Metrics OK?}
        DECISION -->|Yes| PROMOTE[Promote to 100%]
        DECISION -->|No| ROLLBACK[Rollback]
    end

    style BLUE1 fill:#4D96FF
    style GREEN1 fill:#6BCB77
    style CANARY fill:#FFD93D
    style PROMOTE fill:#6BCB77
    style ROLLBACK fill:#FF6B6B
```

## Kubernetes Deployments

### Deployment Flow

```mermaid
flowchart TD
    START([Start Deployment]) --> CHECK{Environment?}

    CHECK -->|Development| DEV_PREP[Prepare Dev Config]
    CHECK -->|Staging| STG_PREP[Prepare Staging Config]
    CHECK -->|Production| PROD_PREP[Prepare Production Config]

    DEV_PREP --> HELM_LINT[Helm Lint]
    STG_PREP --> HELM_LINT
    PROD_PREP --> APPROVAL{Manual Approval?}

    APPROVAL -->|Approved| HELM_LINT
    APPROVAL -->|Rejected| CANCEL([Deployment Cancelled])

    HELM_LINT --> DRY_RUN[Helm Dry Run]
    DRY_RUN --> VALID{Validation OK?}

    VALID -->|No| FIX[Fix Issues]
    FIX --> HELM_LINT

    VALID -->|Yes| DEPLOY[Helm Upgrade/Install]
    DEPLOY --> WAIT[Wait for Rollout]

    WAIT --> HEALTH{Health Check?}
    HEALTH -->|Failed| AUTO_ROLLBACK[Automatic Rollback]
    AUTO_ROLLBACK --> ALERT[Send Alert]
    ALERT --> END([Deployment Failed])

    HEALTH -->|Passed| SMOKE[Smoke Tests]
    SMOKE --> TEST_RESULT{Tests Pass?}

    TEST_RESULT -->|No| MANUAL_ROLLBACK[Manual Rollback]
    MANUAL_ROLLBACK --> ALERT

    TEST_RESULT -->|Yes| MONITOR[Monitor Metrics]
    MONITOR --> SUCCESS([Deployment Successful])

    style START fill:#6BCB77
    style SUCCESS fill:#6BCB77
    style END fill:#FF6B6B
    style CANCEL fill:#FFD93D
    style AUTO_ROLLBACK fill:#FF6B6B
    style MANUAL_ROLLBACK fill:#FF6B6B
```

### Helm Charts

Deploy using Helm:

```bash
# Development
helm upgrade --install docuthinker ./helm/docuthinker \
  -f ./helm/docuthinker/values-dev.yaml \
  -n docuthinker-dev

# Staging
helm upgrade --install docuthinker ./helm/docuthinker \
  -f ./helm/docuthinker/values-staging.yaml \
  -n docuthinker-staging

# Production
helm upgrade --install docuthinker ./helm/docuthinker \
  -f ./helm/docuthinker/values-prod.yaml \
  -n docuthinker-prod
```

### ArgoCD (GitOps)

```mermaid
graph LR
    subgraph "Git Repository"
        REPO[GitHub Repository]
        HELM[Helm Charts]
        VALUES[Value Files]
    end

    subgraph "ArgoCD"
        ARGO[ArgoCD Controller]
        SYNC[Auto Sync]
        HEALTH[Health Check]
    end

    subgraph "Kubernetes Cluster"
        subgraph "Namespaces"
            DEV_NS[docuthinker-dev]
            STG_NS[docuthinker-staging]
            PROD_NS[docuthinker-prod]
        end
    end

    REPO --> ARGO
    HELM --> ARGO
    VALUES --> ARGO

    ARGO -->|Sync| SYNC
    SYNC -->|Deploy| DEV_NS
    SYNC -->|Deploy| STG_NS
    SYNC -->|Deploy| PROD_NS

    SYNC --> HEALTH
    HEALTH -.->|Monitor| DEV_NS
    HEALTH -.->|Monitor| STG_NS
    HEALTH -.->|Monitor| PROD_NS

    HEALTH -->|Drift Detected| SELF_HEAL[Self Heal]
    SELF_HEAL -->|Re-sync| SYNC

    style ARGO fill:#FF6B35
    style SYNC fill:#6BCB77
    style SELF_HEAL fill:#4D96FF
```

Automated deployment with ArgoCD:

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Apply applications
kubectl apply -f argocd/application.yaml

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### Deployment Scripts

Quick deployment:
```bash
./scripts/deploy/deploy.sh production
```

Rollback:
```bash
./scripts/deploy/rollback.sh production 3
```

## Monitoring & Observability

### Monitoring Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        FE[Frontend Pods]
        BE[Backend Pods]
    end

    subgraph "Metrics Collection"
        PROM[Prometheus]
        NODE_EXP[Node Exporter]
        KUBE_STATE[Kube State Metrics]

        FE -.->|/metrics| PROM
        BE -.->|/metrics| PROM
        NODE_EXP -.->|Node Metrics| PROM
        KUBE_STATE -.->|K8s Metrics| PROM
    end

    subgraph "Log Collection"
        FILEBEAT[Filebeat]
        LOGSTASH[Logstash]
        ELASTIC[Elasticsearch]

        FE -.->|Logs| FILEBEAT
        BE -.->|Logs| FILEBEAT
        FILEBEAT --> LOGSTASH
        LOGSTASH --> ELASTIC
    end

    subgraph "Visualization"
        GRAFANA[Grafana]
        KIBANA[Kibana]

        PROM --> GRAFANA
        ELASTIC --> KIBANA
    end

    subgraph "Alerting"
        ALERT_MGR[AlertManager]
        SLACK[Slack]
        PAGERDUTY[PagerDuty]

        PROM -.->|Alerts| ALERT_MGR
        ALERT_MGR --> SLACK
        ALERT_MGR -->|Critical| PAGERDUTY
    end

    style PROM fill:#E85D04
    style GRAFANA fill:#F48C06
    style ELASTIC fill:#005F73
    style KIBANA fill:#0A9396
    style ALERT_MGR fill:#E63946
```

### Observability Data Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant Prom as Prometheus
    participant Alert as AlertManager
    participant Graf as Grafana
    participant User as DevOps Team

    App->>Prom: Expose /metrics endpoint
    loop Every 30s
        Prom->>App: Scrape metrics
    end

    Prom->>Prom: Evaluate alert rules

    alt Alert triggered
        Prom->>Alert: Send alert
        Alert->>Alert: Group & deduplicate
        Alert->>User: Notify via Slack/PagerDuty
    end

    User->>Graf: Access dashboard
    Graf->>Prom: Query metrics
    Prom->>Graf: Return data
    Graf->>User: Display visualizations
```

### Prometheus + Grafana

Access Grafana:
```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
```

Default credentials: `admin` / `prom-operator`

Dashboards:
- DocuThinker Overview
- Kubernetes Cluster Metrics
- Node Exporter

### ELK Stack

Access Kibana:
```bash
kubectl port-forward -n monitoring svc/kibana-kibana 5601:5601
```

Create index pattern: `docuthinker-*`

### Alerting

Alerts are configured in `monitoring/prometheus/alert-rules.yaml`

Notifications sent to:
- Slack: #docuthinker-alerts
- PagerDuty (critical only)

## Secret Management

### Secret Management Architecture

```mermaid
graph TB
    subgraph "Secret Sources"
        VAULT[HashiCorp Vault]
        AWS_SM[AWS Secrets Manager]
        ENV[Environment Variables]
    end

    subgraph "Kubernetes Cluster"
        subgraph "External Secrets Operator"
            ESO[External Secrets Controller]
            STORE[Secret Store]
        end

        subgraph "Applications"
            POD1[Backend Pod]
            POD2[Frontend Pod]
        end

        subgraph "Kubernetes Secrets"
            K8S_SECRET[Kubernetes Secrets]
        end
    end

    VAULT -->|Pull Secrets| ESO
    AWS_SM -->|Pull Secrets| ESO

    ESO --> STORE
    STORE -->|Create/Update| K8S_SECRET

    K8S_SECRET -->|Mount as Env| POD1
    K8S_SECRET -->|Mount as File| POD2

    POD1 -.->|Dynamic Credentials| VAULT

    style VAULT fill:#AA96DA
    style AWS_SM fill:#FF9A00
    style ESO fill:#6BCB77
    style K8S_SECRET fill:#4D96FF
```

### Secret Sync Flow

```mermaid
sequenceDiagram
    participant V as Vault
    participant ESO as External Secrets Operator
    participant K8S as Kubernetes Secret
    participant POD as Application Pod

    Note over ESO: Periodic sync (1 hour)

    ESO->>V: Authenticate with ServiceAccount
    V->>ESO: Return JWT token

    ESO->>V: Request secret
    V->>V: Validate policy
    V->>ESO: Return secret data

    ESO->>K8S: Create/Update Secret
    K8S->>K8S: Store encrypted secret

    POD->>K8S: Request secret
    K8S->>POD: Mount secret as env/file

    alt Secret Rotation
        V->>V: Rotate secret
        ESO->>V: Detect change
        V->>ESO: Return new secret
        ESO->>K8S: Update Secret
        K8S->>POD: Trigger rolling restart
    end
```

### HashiCorp Vault

Install and initialize:
```bash
helm install vault hashicorp/vault -n vault -f secrets/vault/vault-values.yaml
./secrets/vault/init-vault.sh
```

Access UI:
```bash
kubectl port-forward -n vault svc/vault 8200:8200
```

### External Secrets Operator

Automatically syncs secrets from Vault to Kubernetes:

```bash
kubectl apply -f secrets/external-secrets/secret-store.yaml
```

## Performance Testing

### Performance Testing Strategy

```mermaid
graph LR
    subgraph "Test Types"
        LOAD[Load Testing<br/>Expected Load]
        STRESS[Stress Testing<br/>Beyond Capacity]
        SPIKE[Spike Testing<br/>Sudden Load]
        SOAK[Soak Testing<br/>Extended Duration]
    end

    subgraph "k6 Execution"
        K6[k6 Test Runner]
        METRICS[Collect Metrics]
    end

    subgraph "Analysis"
        THRESHOLD{Thresholds Met?}
        REPORT[Generate Report]
    end

    subgraph "Actions"
        PASS[Test Passed]
        FAIL[Test Failed]
        OPTIMIZE[Optimize Performance]
    end

    LOAD & STRESS & SPIKE & SOAK --> K6
    K6 --> METRICS
    METRICS --> THRESHOLD

    THRESHOLD -->|Yes| PASS
    THRESHOLD -->|No| FAIL

    PASS --> REPORT
    FAIL --> REPORT
    FAIL --> OPTIMIZE
    OPTIMIZE --> K6

    style PASS fill:#6BCB77
    style FAIL fill:#FF6B6B
    style OPTIMIZE fill:#FFD93D
```

### Load Test Stages

```mermaid
gantt
    title k6 Load Test Stages
    dateFormat mm:ss
    axisFormat %M:%S

    section Ramp Up
    10 VUs      :a1, 00:00, 2m
    50 VUs      :a2, after a1, 5m
    100 VUs     :a3, after a2, 5m

    section Sustained Load
    100 VUs     :a4, after a3, 5m

    section Ramp Down
    0 VUs       :a5, after a4, 2m
```

### k6 Load Testing

Run load test:
```bash
k6 run --vus 100 --duration 5m scripts/performance/load-test.js
```

Run stress test:
```bash
k6 run scripts/performance/stress-test.js
```

With custom endpoint:
```bash
BASE_URL=https://staging.docuthinker.com k6 run scripts/performance/load-test.js
```

## Security

### Security Layers

```mermaid
graph TB
    subgraph "Layer 1: Code Security"
        SAST[SAST Scanning<br/>SonarQube]
        DEP[Dependency Scanning<br/>npm audit]
        LINT[Security Linting<br/>ESLint]
    end

    subgraph "Layer 2: Container Security"
        TRIVY[Image Scanning<br/>Trivy]
        SIGN[Image Signing<br/>Cosign]
        POLICY[Admission Control<br/>OPA]
    end

    subgraph "Layer 3: Runtime Security"
        RBAC[Role-Based Access<br/>RBAC]
        NET_POL[Network Policies]
        POD_SEC[Pod Security<br/>Standards]
    end

    subgraph "Layer 4: Infrastructure Security"
        WAF_SEC[WAF Rules]
        VPC_SEC[VPC Security Groups]
        ENCRYPT[Encryption at Rest/Transit]
    end

    subgraph "Layer 5: Monitoring Security"
        AUDIT[Audit Logs]
        THREAT[Threat Detection]
        ALERT_SEC[Security Alerts]
    end

    SAST --> TRIVY
    DEP --> TRIVY
    LINT --> TRIVY

    TRIVY --> RBAC
    SIGN --> RBAC
    POLICY --> RBAC

    RBAC --> WAF_SEC
    NET_POL --> WAF_SEC
    POD_SEC --> WAF_SEC

    WAF_SEC --> AUDIT
    VPC_SEC --> AUDIT
    ENCRYPT --> AUDIT

    AUDIT --> THREAT --> ALERT_SEC

    style SAST fill:#FF6B6B
    style TRIVY fill:#4ECDC4
    style RBAC fill:#95E1D3
    style WAF_SEC fill:#F38181
    style AUDIT fill:#AA96DA
```

### Security Scanning Pipeline

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git Repository
    participant CI as CI Pipeline
    participant Trivy as Trivy Scanner
    participant Sonar as SonarQube
    participant Reg as Container Registry

    Dev->>Git: Push code
    Git->>CI: Trigger pipeline

    CI->>Sonar: Run SAST scan
    Sonar->>Sonar: Analyze code quality
    Sonar->>CI: Return findings

    CI->>CI: Build Docker image
    CI->>Trivy: Scan image
    Trivy->>Trivy: Check vulnerabilities
    Trivy->>CI: Return results

    alt Critical vulnerabilities found
        CI->>Dev: Block & notify
    else No critical issues
        CI->>Reg: Push image
        Reg->>Dev: Deployment ready
    end
```

### Trivy Scanning

Run security scans:
```bash
chmod +x scripts/security/trivy-scan.sh
./scripts/security/trivy-scan.sh
```

### SonarQube Analysis

```bash
sonar-scanner -Dproject.settings=scripts/security/sonarqube.properties
```

### Security Best Practices

1. Regularly update dependencies
2. Scan container images before deployment
3. Use secrets management (never hardcode secrets)
4. Enable network policies
5. Implement RBAC
6. Regular security audits

## Troubleshooting

### Pod not starting

```bash
kubectl describe pod <pod-name> -n docuthinker-prod
kubectl logs <pod-name> -n docuthinker-prod
```

### Database connection issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h postgres.docuthinker-prod.svc.cluster.local -U docuthinker
```

### High error rate

1. Check application logs
2. Review Prometheus alerts
3. Check resource utilization
4. Review recent deployments

### Rollback procedure

```mermaid
flowchart TD
    ISSUE([Issue Detected]) --> SEVERITY{Severity Level}

    SEVERITY -->|Critical| AUTO_RB[Automatic Rollback]
    SEVERITY -->|High| MANUAL_RB[Manual Rollback Decision]
    SEVERITY -->|Medium/Low| INVESTIGATE[Investigate & Fix]

    AUTO_RB --> GET_HISTORY[Get Deployment History]
    MANUAL_RB --> GET_HISTORY

    GET_HISTORY --> SELECT{Select Revision}
    SELECT -->|Previous| PREV_REV[Rollback to N-1]
    SELECT -->|Specific| SPEC_REV[Rollback to Specific]

    PREV_REV --> EXECUTE_RB[Execute Rollback]
    SPEC_REV --> EXECUTE_RB

    EXECUTE_RB --> WAIT_RB[Wait for Rollout]
    WAIT_RB --> VERIFY_RB{Verify Health}

    VERIFY_RB -->|Failed| ESCALATE[Escalate to Team]
    VERIFY_RB -->|Success| MONITOR_POST[Post-Rollback Monitoring]

    MONITOR_POST --> ROOT_CAUSE[Root Cause Analysis]
    ROOT_CAUSE --> DOCUMENT[Document Incident]
    DOCUMENT --> COMPLETE([Rollback Complete])

    INVESTIGATE --> FIX_FORWARD[Fix Forward]
    FIX_FORWARD --> DEPLOY_FIX[Deploy Fix]
    DEPLOY_FIX --> COMPLETE

    style ISSUE fill:#FF6B6B
    style AUTO_RB fill:#FFD93D
    style COMPLETE fill:#6BCB77
    style ESCALATE fill:#FF6B6B
```

```bash
# View history
helm history docuthinker -n docuthinker-prod

# Rollback
./scripts/deploy/rollback.sh production <revision>
```

## Maintenance

### Regular Tasks

```mermaid
gantt
    title DevOps Maintenance Schedule
    dateFormat YYYY-MM-DD

    section Daily Tasks
    Monitor Alerts           :d1, 2025-01-01, 1d
    Review Error Logs        :d2, 2025-01-01, 1d
    Check Resource Usage     :d3, 2025-01-01, 1d

    section Weekly Tasks
    Security Scans           :w1, 2025-01-01, 7d
    Dependency Updates       :w2, 2025-01-01, 7d
    Cost Optimization        :w3, 2025-01-01, 7d

    section Monthly Tasks
    Backup Verification      :m1, 2025-01-01, 30d
    Security Audit           :m2, 2025-01-01, 30d
    Performance Review       :m3, 2025-01-01, 30d
    Documentation Update     :m4, 2025-01-01, 30d
```

**Daily:**
- Monitor alerts
- Review error logs
- Check resource utilization

**Weekly:**
- Review security scans
- Update dependencies
- Review and optimize costs

**Monthly:**
- Backup verification
- Security audit
- Performance review
- Update documentation

### Backup Procedures

Database backups are automated via AWS Backup.

Manual backup:
```bash
kubectl exec -n docuthinker-prod <postgres-pod> -- \
  pg_dump -U docuthinker docuthinker > backup.sql
```

### Disaster Recovery

```mermaid
flowchart TD
    INCIDENT([Disaster Detected]) --> ASSESS{Assess Impact}

    ASSESS -->|Infrastructure| INFRA_DR[Infrastructure Recovery]
    ASSESS -->|Data| DATA_DR[Data Recovery]
    ASSESS -->|Application| APP_DR[Application Recovery]

    subgraph "Infrastructure Recovery"
        INFRA_DR --> TF_STATE[Load Terraform State]
        TF_STATE --> TF_APPLY[Terraform Apply]
        TF_APPLY --> VERIFY_INFRA{Infrastructure OK?}
        VERIFY_INFRA -->|No| TF_DEBUG[Debug Issues]
        TF_DEBUG --> TF_APPLY
        VERIFY_INFRA -->|Yes| INFRA_READY[Infrastructure Ready]
    end

    subgraph "Data Recovery"
        DATA_DR --> RDS_SNAP[Locate RDS Snapshot]
        RDS_SNAP --> RESTORE_DB[Restore Database]
        RESTORE_DB --> VERIFY_DATA{Data Integrity?}
        VERIFY_DATA -->|No| POINT_IN_TIME[Point-in-Time Recovery]
        POINT_IN_TIME --> RESTORE_DB
        VERIFY_DATA -->|Yes| DATA_READY[Data Ready]
    end

    subgraph "Application Recovery"
        APP_DR --> LAST_GOOD[Identify Last Good Version]
        LAST_GOOD --> DEPLOY_APP[Deploy Application]
        DEPLOY_APP --> RESTORE_SECRETS[Restore Secrets from Vault]
        RESTORE_SECRETS --> APP_READY[Application Ready]
    end

    INFRA_READY --> FINAL_CHECK{All Systems Ready?}
    DATA_READY --> FINAL_CHECK
    APP_READY --> FINAL_CHECK

    FINAL_CHECK -->|No| TROUBLESHOOT[Troubleshoot]
    TROUBLESHOOT --> FINAL_CHECK

    FINAL_CHECK -->|Yes| SMOKE_TEST[Run Smoke Tests]
    SMOKE_TEST --> MONITOR_REC[Enhanced Monitoring]
    MONITOR_REC --> POSTMORTEM[Post-Mortem Analysis]
    POSTMORTEM --> SUCCESS([Recovery Complete])

    style INCIDENT fill:#FF6B6B
    style SUCCESS fill:#6BCB77
    style TROUBLESHOOT fill:#FFD93D
```

Disaster Recovery Steps:

1. Restore infrastructure from Terraform
2. Restore database from RDS snapshots
3. Deploy application from last known good version
4. Restore secrets from backup
5. Verify functionality

## Support

For issues:
1. Check this documentation
2. Review logs and metrics
3. Contact DevOps team
4. Create incident ticket

## Contributing

When making changes:
1. Update documentation
2. Test in dev/staging first
3. Follow deployment procedures
4. Monitor after deployment
5. Update runbooks if needed

## Infrastructure Cost Optimization

```mermaid
graph TB
    subgraph "Cost Analysis"
        METRICS[Collect Cost Metrics]
        ANALYZE[Analyze Spending]
        IDENTIFY[Identify Waste]
    end

    subgraph "Optimization Strategies"
        SPOT[Use Spot Instances]
        SCALE[Right-size Resources]
        RESERVE[Reserved Instances]
        LIFECYCLE[S3 Lifecycle Policies]
    end

    subgraph "Implementation"
        TERRAFORM[Update Terraform]
        TEST[Test Changes]
        DEPLOY[Deploy Updates]
    end

    subgraph "Monitoring"
        TRACK[Track Savings]
        REPORT[Monthly Reports]
        REVIEW[Quarterly Review]
    end

    METRICS --> ANALYZE
    ANALYZE --> IDENTIFY

    IDENTIFY --> SPOT & SCALE & RESERVE & LIFECYCLE

    SPOT --> TERRAFORM
    SCALE --> TERRAFORM
    RESERVE --> TERRAFORM
    LIFECYCLE --> TERRAFORM

    TERRAFORM --> TEST
    TEST --> DEPLOY

    DEPLOY --> TRACK
    TRACK --> REPORT
    REPORT --> REVIEW
    REVIEW -.-> METRICS

    style IDENTIFY fill:#FFD93D
    style TRACK fill:#6BCB77
    style DEPLOY fill:#4D96FF
```

## System Health Dashboard

```mermaid
graph LR
    subgraph "Application Health"
        APP_UP[Uptime: 99.9%]
        APP_ERR[Error Rate: 0.1%]
        APP_LAT[Latency: p95 < 500ms]
    end

    subgraph "Infrastructure Health"
        INFRA_CPU[CPU Usage: 45%]
        INFRA_MEM[Memory Usage: 60%]
        INFRA_DISK[Disk Usage: 40%]
    end

    subgraph "Data Layer Health"
        DB_CONN[DB Connections: 25/100]
        CACHE_HIT[Cache Hit Rate: 85%]
        DB_LAG[Replication Lag: 0s]
    end

    subgraph "Overall Status"
        STATUS[System Status: Healthy]
    end

    APP_UP & APP_ERR & APP_LAT --> STATUS
    INFRA_CPU & INFRA_MEM & INFRA_DISK --> STATUS
    DB_CONN & CACHE_HIT & DB_LAG --> STATUS

    style STATUS fill:#6BCB77
    style APP_UP fill:#6BCB77
    style CACHE_HIT fill:#6BCB77
```

---

**Last Updated**: 2025-01-26
**Maintainer**: Son Nguyen
**Documentation Version**: 2.0.0

## Quick Reference

### Common Commands Cheatsheet

```bash
# Deployment
./scripts/deploy/deploy.sh [dev|staging|production]

# Rollback
./scripts/deploy/rollback.sh [environment] [revision]

# View logs
kubectl logs -f deployment/docuthinker-backend -n docuthinker-prod

# Scale deployment
kubectl scale deployment/docuthinker-backend --replicas=5 -n docuthinker-prod

# Port forward services
kubectl port-forward svc/grafana 3000:80 -n monitoring

# Run performance test
k6 run --vus 100 --duration 5m scripts/performance/load-test.js

# Security scan
./scripts/security/trivy-scan.sh

# Access ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### Emergency Contacts

| Role | Contact | Escalation Level |
|------|---------|------------------|
| DevOps Lead | devops-lead@docuthinker.com | Primary |
| Platform Team | platform@docuthinker.com | Secondary |
| On-Call Engineer | oncall@docuthinker.com | 24/7 |
| Security Team | security@docuthinker.com | Security Issues |
