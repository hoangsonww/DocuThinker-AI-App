# DocuThinker AWS Infrastructure

[![AWS](https://img.shields.io/badge/AWS-Cloud-orange.svg)](https://aws.amazon.com/)
[![ECS](https://img.shields.io/badge/ECS-Fargate-blue.svg)](https://aws.amazon.com/ecs/)
[![CDK](https://img.shields.io/badge/AWS_CDK-2.x-green.svg)](https://aws.amazon.com/cdk/)
[![CloudFormation](https://img.shields.io/badge/CloudFormation-IaC-purple.svg)](https://aws.amazon.com/cloudformation/)

> **Production-grade AWS infrastructure for DocuThinker's AI-powered document intelligence platform using ECS Fargate, AWS CDK, and CloudFormation.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [High-Level Architecture](#high-level-architecture)
  - [Infrastructure Diagram](#infrastructure-diagram)
  - [Network Architecture](#network-architecture)
  - [CI/CD Pipeline](#cicd-pipeline)
- [Components](#components)
- [Deployment Options](#deployment-options)
  - [AWS CDK Deployment](#aws-cdk-deployment)
  - [CloudFormation Deployment](#cloudformation-deployment)
  - [Manual Deployment](#manual-deployment)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
  - [1. ECR Repository Setup](#1-ecr-repository-setup)
  - [2. Secrets Manager Configuration](#2-secrets-manager-configuration)
  - [3. VPC and Network Setup](#3-vpc-and-network-setup)
  - [4. ECS Cluster Deployment](#4-ecs-cluster-deployment)
  - [5. Load Balancer Configuration](#5-load-balancer-configuration)
- [Configuration](#configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Security](#security)
- [Cost Optimization](#cost-optimization)
- [Scaling](#scaling)
- [Disaster Recovery](#disaster-recovery)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Maintenance](#maintenance)
- [FAQ](#faq)

---

## Overview

DocuThinker's AWS infrastructure is designed for **production-grade deployment** of the AI/ML platform with:

- 🚀 **ECS Fargate** - Serverless container orchestration
- 🔒 **Secrets Manager** - Secure API key management
- 📊 **Application Load Balancer** - High-availability traffic distribution
- 🗄️ **Multi-Region Support** - Global deployment capability
- 📈 **Auto-Scaling** - Dynamic resource allocation
- 🔐 **VPC Isolation** - Network security and segmentation
- 📝 **CloudWatch Logging** - Centralized monitoring
- 🏗️ **Infrastructure as Code** - CDK and CloudFormation templates

### Deployment Model

```
Frontend (Vercel) → CloudFront → ALB → ECS Fargate Services
                                         ├── Backend Service (Node.js)
                                         └── AI/ML Service (FastAPI)
                                              ├── Neo4j (Aura/Neptune)
                                              └── ChromaDB (EFS/EC2)
```

---

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "External Users"
        USER[Users/Clients]
        ADMIN[Administrators]
    end

    subgraph "Frontend Layer"
        VERCEL[Vercel Frontend]
        CF[CloudFront CDN]
        S3[S3 Static Assets]
    end

    subgraph "AWS Cloud - Production VPC"
        subgraph "Public Subnets"
            ALB[Application Load Balancer]
            NAT[NAT Gateway]
        end

        subgraph "Private Subnets"
            subgraph "ECS Cluster"
                BACKEND[Backend Service<br/>Node.js/Express<br/>Port 5000]
                AIML[AI/ML Service<br/>FastAPI/Python<br/>Port 8000]
            end
        end

        subgraph "Data Layer"
            MONGO[(MongoDB Atlas /<br/>DocumentDB)]
            REDIS[(ElastiCache Redis)]
            NEO4J[(Neo4j Aura /<br/>Neptune)]
            CHROMA[(ChromaDB on EFS)]
        end

        subgraph "Management & Security"
            ECR[ECR Container Registry]
            SM[Secrets Manager]
            CW[CloudWatch Logs & Metrics]
            IAM[IAM Roles & Policies]
        end
    end

    subgraph "CI/CD Pipeline"
        JENKINS[Jenkins]
        CB[CodeBuild]
        CDP[CodePipeline]
    end

    USER --> VERCEL
    USER --> CF
    CF --> ALB
    ADMIN --> ALB

    ALB --> BACKEND
    ALB --> AIML

    BACKEND --> MONGO
    BACKEND --> REDIS
    AIML --> NEO4J
    AIML --> CHROMA

    BACKEND -.->|Read Secrets| SM
    AIML -.->|Read Secrets| SM

    BACKEND -.->|Logs| CW
    AIML -.->|Logs| CW

    JENKINS --> CB
    CB --> ECR
    CB --> CDP
    CDP --> BACKEND
    CDP --> AIML

    BACKEND --> IAM
    AIML --> IAM

    style ALB fill:#FF9900,stroke:#232F3E,stroke-width:3px,color:#fff
    style BACKEND fill:#527FFF,stroke:#232F3E,stroke-width:2px,color:#fff
    style AIML fill:#3F8624,stroke:#232F3E,stroke-width:2px,color:#fff
    style ECR fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#fff
    style SM fill:#DD344C,stroke:#232F3E,stroke-width:2px,color:#fff
```

### Infrastructure Diagram

```mermaid
graph LR
    subgraph "Region: us-east-1"
        subgraph "VPC (10.0.0.0/16)"
            subgraph "AZ-1 (us-east-1a)"
                PUB1[Public Subnet<br/>10.0.1.0/24]
                PRIV1[Private Subnet<br/>10.0.3.0/24]
            end

            subgraph "AZ-2 (us-east-1b)"
                PUB2[Public Subnet<br/>10.0.2.0/24]
                PRIV2[Private Subnet<br/>10.0.4.0/24]
            end

            IGW[Internet Gateway]
            ALB_NODE[ALB]
            NAT1[NAT Gateway]
            NAT2[NAT Gateway]

            PUB1 --> IGW
            PUB2 --> IGW
            PUB1 --> NAT1
            PUB2 --> NAT2

            ALB_NODE --> PUB1
            ALB_NODE --> PUB2

            PRIV1 --> NAT1
            PRIV2 --> NAT2

            subgraph "ECS Cluster"
                TASK1[Fargate Task<br/>Backend]
                TASK2[Fargate Task<br/>AI/ML]
                TASK3[Fargate Task<br/>Backend]
                TASK4[Fargate Task<br/>AI/ML]
            end

            TASK1 --> PRIV1
            TASK2 --> PRIV1
            TASK3 --> PRIV2
            TASK4 --> PRIV2
        end
    end

    style PUB1 fill:#3F8624,stroke:#232F3E,stroke-width:2px,color:#fff
    style PUB2 fill:#3F8624,stroke:#232F3E,stroke-width:2px,color:#fff
    style PRIV1 fill:#527FFF,stroke:#232F3E,stroke-width:2px,color:#fff
    style PRIV2 fill:#527FFF,stroke:#232F3E,stroke-width:2px,color:#fff
    style ALB_NODE fill:#FF9900,stroke:#232F3E,stroke-width:3px,color:#fff
```

### Network Architecture

**VPC Configuration:**
- **CIDR Block**: 10.0.0.0/16
- **Availability Zones**: 2 (us-east-1a, us-east-1b)
- **Public Subnets**: 2 (10.0.1.0/24, 10.0.2.0/24)
- **Private Subnets**: 2 (10.0.3.0/24, 10.0.4.0/24)
- **NAT Gateways**: 2 (one per AZ for high availability)
- **Internet Gateway**: 1

**Security Groups:**
- **ALB Security Group**: Allows inbound HTTP/HTTPS (80, 443)
- **Backend Security Group**: Allows inbound from ALB on port 5000
- **AI/ML Security Group**: Allows inbound from ALB on port 8000
- **Database Security Group**: Allows inbound from Backend/AI/ML services

### CI/CD Pipeline

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitHub
    participant Jenkins as Jenkins
    participant CB as CodeBuild
    participant ECR as ECR
    participant ECS as ECS Fargate
    participant ALB as Load Balancer

    Dev->>Git: git push
    Git->>Jenkins: Webhook Trigger
    Jenkins->>CB: Start Build Job

    CB->>CB: 1. Run Tests
    CB->>CB: 2. Build Docker Images
    CB->>ECR: 3. Push Images
    CB->>CB: 4. Update Task Definitions

    Jenkins->>ECS: 5. Deploy New Tasks
    ECS->>ECS: 6. Blue/Green Deployment
    ECS->>ALB: 7. Register New Tasks
    ALB->>ECS: 8. Health Check
    ECS->>ECS: 9. Deregister Old Tasks

    Jenkins-->>Dev: Deployment Complete
```

---

## Components

### Infrastructure Components

| Component | Technology | Purpose | Configuration |
|-----------|-----------|---------|---------------|
| **Container Orchestration** | ECS Fargate | Serverless container management | `aws/cloudformation/fargate-service.yaml` |
| **Load Balancer** | Application Load Balancer | Traffic distribution & SSL termination | Auto-configured via CDK/CFN |
| **Container Registry** | Amazon ECR | Docker image storage | `docuthinker-backend`, `docuthinker-ai-ml` |
| **Secrets Management** | AWS Secrets Manager | Secure API key storage | `docuthinker/*` secrets |
| **Networking** | Amazon VPC | Network isolation & security | 2 AZs, public/private subnets |
| **Monitoring** | CloudWatch | Logs, metrics, alarms | Container logs, health metrics |
| **CDN** | CloudFront | Static asset caching | Optional for S3 assets |
| **Database** | MongoDB Atlas/DocumentDB | Primary data store | External/managed |
| **Cache** | ElastiCache Redis | Session & caching layer | External/managed |
| **Knowledge Graph** | Neo4j Aura/Neptune | Graph database | External/managed |
| **Vector Store** | ChromaDB on EFS | Persistent embeddings | EFS-backed volume |

### Service Breakdown

#### Backend Service

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Port**: 5000
- **Resources**: 512 CPU units, 1024 MB memory
- **Instances**: 2 (minimum)
- **Health Check**: `/health` endpoint
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=5000`
  - API keys from Secrets Manager

#### AI/ML Service

- **Runtime**: Python 3.10+
- **Framework**: FastAPI
- **Port**: 8000
- **Resources**: 512 CPU units, 1024 MB memory
- **Instances**: 2 (minimum)
- **Health Check**: `/health` endpoint
- **Environment Variables**:
  - `DOCUTHINKER_SYNC_GRAPH=true`
  - `DOCUTHINKER_SYNC_VECTOR=true`
  - API keys and DB credentials from Secrets Manager

---

## Deployment Options

### AWS CDK Deployment

**Recommended for production and automated deployments.**

#### Prerequisites

```bash
npm install -g aws-cdk
cd aws/infrastructure
npm install
```

#### Deploy

```bash
# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-ID/REGION

# Synthesize CloudFormation template
cdk synth

# Deploy stack
cdk deploy DocuThinkerStack

# View outputs
cdk deploy --outputs-file outputs.json
```

#### Destroy

```bash
cdk destroy DocuThinkerStack
```

### CloudFormation Deployment

**Alternative deployment using raw CloudFormation templates.**

#### Prerequisites

- AWS CLI configured
- ECR images built and pushed
- Secrets Manager configured

#### Deploy

```bash
# Validate template
aws cloudformation validate-template \
  --template-body file://aws/cloudformation/fargate-service.yaml

# Create stack
aws cloudformation create-stack \
  --stack-name docuthinker-stack \
  --template-body file://aws/cloudformation/fargate-service.yaml \
  --parameters \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=PublicSubnets,ParameterValue=subnet-xxxxx,subnet-yyyyy \
    ParameterKey=BackendImage,ParameterValue=ACCOUNT.dkr.ecr.REGION.amazonaws.com/docuthinker-backend:latest \
    ParameterKey=AIMLImage,ParameterValue=ACCOUNT.dkr.ecr.REGION.amazonaws.com/docuthinker-ai-ml:latest \
  --capabilities CAPABILITY_IAM

# Monitor stack creation
aws cloudformation wait stack-create-complete \
  --stack-name docuthinker-stack

# Get outputs
aws cloudformation describe-stacks \
  --stack-name docuthinker-stack \
  --query 'Stacks[0].Outputs'
```

#### Update Stack

```bash
aws cloudformation update-stack \
  --stack-name docuthinker-stack \
  --template-body file://aws/cloudformation/fargate-service.yaml \
  --parameters \
    ParameterKey=BackendImage,ParameterValue=ACCOUNT.dkr.ecr.REGION.amazonaws.com/docuthinker-backend:v2.0 \
    ParameterKey=AIMLImage,ParameterValue=ACCOUNT.dkr.ecr.REGION.amazonaws.com/docuthinker-ai-ml:v2.0
```

#### Delete Stack

```bash
aws cloudformation delete-stack --stack-name docuthinker-stack
```

### Manual Deployment

**For development and testing purposes.**

See [Detailed Setup](#detailed-setup) section below.

---

## Prerequisites

### Required Tools

- **AWS CLI**: 2.x or higher
  ```bash
  aws --version
  ```

- **AWS CDK**: 2.x (for CDK deployment)
  ```bash
  npm install -g aws-cdk
  cdk --version
  ```

- **Docker**: For building container images
  ```bash
  docker --version
  ```

- **Node.js**: 18+ (for CDK)
  ```bash
  node --version
  ```

### AWS Account Setup

1. **AWS Account**: Active AWS account with appropriate permissions
2. **IAM User/Role**: Admin access or specific permissions:
   - `AmazonECS_FullAccess`
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AmazonVPCFullAccess`
   - `IAMFullAccess`
   - `SecretsManagerReadWrite`
   - `CloudWatchLogsFullAccess`
   - `ElasticLoadBalancingFullAccess`

3. **AWS CLI Configuration**:
   ```bash
   aws configure
   # AWS Access Key ID: YOUR_ACCESS_KEY
   # AWS Secret Access Key: YOUR_SECRET_KEY
   # Default region name: us-east-1
   # Default output format: json
   ```

4. **Default VPC**: Or create custom VPC

---

## Quick Start

### 1. Configure AWS Credentials

```bash
export AWS_PROFILE=your-profile
export AWS_REGION=us-east-1
```

### 2. Create ECR Repositories

```bash
aws ecr create-repository --repository-name docuthinker-backend
aws ecr create-repository --repository-name docuthinker-ai-ml
```

### 3. Build and Push Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t docuthinker-backend .
docker tag docuthinker-backend:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/docuthinker-backend:latest
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/docuthinker-backend:latest

# Build and push AI/ML
cd ../ai_ml
docker build -t docuthinker-ai-ml .
docker tag docuthinker-ai-ml:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/docuthinker-ai-ml:latest
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/docuthinker-ai-ml:latest
```

### 4. Configure Secrets

```bash
# Create secrets in Secrets Manager
aws secretsmanager create-secret \
  --name docuthinker/openai \
  --secret-string "sk-..."

aws secretsmanager create-secret \
  --name docuthinker/anthropic \
  --secret-string "sk-ant-..."

aws secretsmanager create-secret \
  --name docuthinker/google \
  --secret-string "..."

aws secretsmanager create-secret \
  --name docuthinker/neo4j \
  --secret-string "bolt://neo4j.example.com:7687"

aws secretsmanager create-secret \
  --name docuthinker/chroma \
  --secret-string "/mnt/efs/chroma"
```

### 5. Deploy with CDK

```bash
cd aws/infrastructure
npm install
cdk deploy DocuThinkerStack
```

### 6. Verify Deployment

```bash
# Get ALB DNS name
aws cloudformation describe-stacks \
  --stack-name DocuThinkerStack \
  --query 'Stacks[0].Outputs'

# Test backend
curl http://ALB-DNS-NAME/health

# Test AI/ML service
curl http://ALB-DNS-NAME:8080/health
```

---

## Detailed Setup

### 1. ECR Repository Setup

#### Create Repositories

```bash
# Backend repository
aws ecr create-repository \
  --repository-name docuthinker-backend \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# AI/ML repository
aws ecr create-repository \
  --repository-name docuthinker-ai-ml \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256
```

#### Set Lifecycle Policies

```bash
# Keep only last 10 images
aws ecr put-lifecycle-policy \
  --repository-name docuthinker-backend \
  --lifecycle-policy-text '{
    "rules": [{
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    }]
  }'
```

#### Configure Cross-Region Replication (Optional)

```bash
aws ecr put-replication-configuration \
  --replication-configuration '{
    "rules": [{
      "destinations": [{
        "region": "us-west-2",
        "registryId": "ACCOUNT-ID"
      }]
    }]
  }'
```

### 2. Secrets Manager Configuration

#### Create Secret Structure

```json
{
  "docuthinker/openai": "sk-proj-...",
  "docuthinker/anthropic": "sk-ant-...",
  "docuthinker/google": "AIza...",
  "docuthinker/neo4j": "bolt://username:password@host:7687",
  "docuthinker/chroma": "/mnt/efs/chroma",
  "docuthinker/mongodb": "mongodb+srv://...",
  "docuthinker/redis": "redis://..."
}
```

#### Create Secrets via CLI

```bash
#!/bin/bash

SECRETS=(
  "docuthinker/openai:sk-proj-..."
  "docuthinker/anthropic:sk-ant-..."
  "docuthinker/google:AIza..."
  "docuthinker/neo4j:bolt://user:pass@host:7687"
  "docuthinker/chroma:/mnt/efs/chroma"
)

for secret in "${SECRETS[@]}"; do
  IFS=':' read -r name value <<< "$secret"
  aws secretsmanager create-secret \
    --name "$name" \
    --secret-string "$value" \
    --description "DocuThinker API key/config"
done
```

#### Rotate Secrets (Best Practice)

```bash
aws secretsmanager rotate-secret \
  --secret-id docuthinker/openai \
  --rotation-lambda-arn arn:aws:lambda:REGION:ACCOUNT:function:SecretRotation \
  --rotation-rules AutomaticallyAfterDays=30
```

### 3. VPC and Network Setup

#### Option A: Use Default VPC

```bash
# Get default VPC ID
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true"

# Get subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-xxxxx"
```

#### Option B: Create Custom VPC

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=docuthinker-vpc}]'

# Create public subnets
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# Create private subnets
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.3.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.4.0/24 --availability-zone us-east-1b

# Create Internet Gateway
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id vpc-xxxxx --internet-gateway-id igw-xxxxx

# Create NAT Gateways
aws ec2 allocate-address --domain vpc
aws ec2 create-nat-gateway --subnet-id subnet-xxxxx --allocation-id eipalloc-xxxxx
```

### 4. ECS Cluster Deployment

#### Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name docuthinker-cluster
```

#### Register Task Definitions

Backend task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition-backend.json
```

**task-definition-backend.json**:
```json
{
  "family": "docuthinker-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [{
    "name": "backend",
    "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/docuthinker-backend:latest",
    "portMappings": [{
      "containerPort": 5000,
      "protocol": "tcp"
    }],
    "environment": [{
      "name": "NODE_ENV",
      "value": "production"
    }],
    "secrets": [
      {
        "name": "OPENAI_API_KEY",
        "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:docuthinker/openai"
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/docuthinker-backend",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
```

#### Create Services

```bash
aws ecs create-service \
  --cluster docuthinker-cluster \
  --service-name backend-service \
  --task-definition docuthinker-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

### 5. Load Balancer Configuration

#### Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name docuthinker-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application

# Create target groups
aws elbv2 create-target-group \
  --name backend-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /health

aws elbv2 create-target-group \
  --name aiml-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /health

# Create listeners
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

---

## Configuration

### Environment Variables

#### Backend Service

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Node environment | `production` | Yes |
| `PORT` | Server port | `5000` | No |
| `OPENAI_API_KEY` | OpenAI API key | - | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key | - | Yes |
| `GOOGLE_API_KEY` | Google API key | - | Yes |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `REDIS_URL` | Redis connection string | - | Yes |

#### AI/ML Service

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DOCUTHINKER_SYNC_GRAPH` | Enable Neo4j sync | `true` | No |
| `DOCUTHINKER_SYNC_VECTOR` | Enable ChromaDB sync | `true` | No |
| `OPENAI_API_KEY` | OpenAI API key | - | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key | - | Yes |
| `GOOGLE_API_KEY` | Google API key | - | Yes |
| `DOCUTHINKER_NEO4J_URI` | Neo4j connection URI | - | Yes* |
| `DOCUTHINKER_CHROMA_DIR` | ChromaDB directory | `/mnt/efs/chroma` | Yes* |

\* Required if corresponding sync flag is enabled

### CDK Configuration

**aws/infrastructure/cdk-app.ts**:

```typescript
const app = new cdk.App();
new DocuThinkerStack(app, "DocuThinkerStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
  // Custom configurations
  desiredCount: 2,
  cpu: 512,
  memory: 1024,
  backendPort: 5000,
  aimlPort: 8000,
});
```

### CloudFormation Parameters

**aws/cloudformation/fargate-service.yaml parameters**:

```yaml
Parameters:
  VpcId: vpc-xxxxx
  PublicSubnets: subnet-xxxxx,subnet-yyyyy
  ClusterName: docuthinker-cluster
  BackendImage: ACCOUNT.dkr.ecr.REGION.amazonaws.com/docuthinker-backend:latest
  AIMLImage: ACCOUNT.dkr.ecr.REGION.amazonaws.com/docuthinker-ai-ml:latest
  ContainerPort: 5000
  AIMLPort: 8000
  DesiredCount: 2
  CPU: 512
  Memory: 1024
  SecretsPrefix: docuthinker
```

---

## Monitoring & Logging

### CloudWatch Logs

#### Log Groups

```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/docuthinker-backend
aws logs create-log-group --log-group-name /ecs/docuthinker-ai-ml

# Set retention
aws logs put-retention-policy \
  --log-group-name /ecs/docuthinker-backend \
  --retention-in-days 30
```

#### View Logs

```bash
# Stream logs
aws logs tail /ecs/docuthinker-backend --follow

# Query logs
aws logs filter-log-events \
  --log-group-name /ecs/docuthinker-backend \
  --filter-pattern "ERROR"
```

### CloudWatch Metrics

#### Key Metrics to Monitor

| Metric | Description | Threshold |
|--------|-------------|-----------|
| `CPUUtilization` | Task CPU usage | > 80% |
| `MemoryUtilization` | Task memory usage | > 85% |
| `TargetResponseTime` | ALB response time | > 1000ms |
| `HealthyHostCount` | Healthy targets | < 1 |
| `UnHealthyHostCount` | Unhealthy targets | > 0 |
| `RequestCount` | Total requests | - |
| `HTTPCode_Target_4XX_Count` | Client errors | > 100/min |
| `HTTPCode_Target_5XX_Count` | Server errors | > 10/min |

#### Create Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name docuthinker-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=backend-service Name=ClusterName,Value=docuthinker-cluster

# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name docuthinker-high-errors \
  --alarm-description "Alert when 5XX errors exceed 10/min" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### Container Insights

Enable Container Insights for enhanced monitoring:

```bash
aws ecs update-cluster-settings \
  --cluster docuthinker-cluster \
  --settings name=containerInsights,value=enabled
```

### X-Ray Tracing (Optional)

Enable AWS X-Ray for distributed tracing:

```bash
# Add X-Ray daemon to task definition
{
  "name": "xray-daemon",
  "image": "amazon/aws-xray-daemon",
  "cpu": 32,
  "memoryReservation": 256,
  "portMappings": [{
    "containerPort": 2000,
    "protocol": "udp"
  }]
}
```

---

## Security

### IAM Roles and Policies

#### Task Execution Role

Allows ECS to pull images and write logs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

#### Task Role

Allows containers to access AWS services:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "dynamodb:Query",
        "dynamodb:PutItem",
        "sqs:SendMessage"
      ],
      "Resource": [
        "arn:aws:s3:::docuthinker-*/*",
        "arn:aws:dynamodb:*:*:table/docuthinker-*",
        "arn:aws:sqs:*:*:docuthinker-*"
      ]
    }
  ]
}
```

### Security Groups

#### ALB Security Group

```bash
# Allow inbound HTTP/HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

#### ECS Security Group

```bash
# Allow inbound from ALB
aws ec2 authorize-security-group-ingress \
  --group-id sg-yyyyy \
  --protocol tcp \
  --port 5000 \
  --source-group sg-xxxxx

aws ec2 authorize-security-group-ingress \
  --group-id sg-yyyyy \
  --protocol tcp \
  --port 8000 \
  --source-group sg-xxxxx
```

### Secrets Encryption

Enable encryption at rest for Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name docuthinker/openai \
  --secret-string "sk-..." \
  --kms-key-id arn:aws:kms:REGION:ACCOUNT:key/KEY-ID
```

### Network Security

- ✅ **Private Subnets**: Deploy ECS tasks in private subnets
- ✅ **NAT Gateway**: Use NAT for outbound internet access
- ✅ **VPC Endpoints**: Use VPC endpoints for AWS services (S3, ECR, Secrets Manager)
- ✅ **Network ACLs**: Configure network ACLs for subnet-level security
- ✅ **WAF**: Deploy AWS WAF on ALB for application-layer protection

### SSL/TLS Configuration

#### Request ACM Certificate

```bash
aws acm request-certificate \
  --domain-name api.docuthinker.ai \
  --validation-method DNS \
  --subject-alternative-names "*.api.docuthinker.ai"
```

#### Add HTTPS Listener

```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

---

## Cost Optimization

### Cost Breakdown (Estimated Monthly)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| **ECS Fargate** | 4 tasks × 0.5 vCPU × 1 GB × 730 hours | ~$70 |
| **Application Load Balancer** | 1 ALB + 2 LCUs | ~$30 |
| **NAT Gateway** | 2 NAT gateways + data transfer | ~$90 |
| **CloudWatch Logs** | 10 GB ingestion + storage | ~$15 |
| **ECR Storage** | 20 GB storage | ~$2 |
| **Secrets Manager** | 10 secrets | ~$4 |
| **Data Transfer** | 100 GB out | ~$9 |
| **Total** | | **~$220/month** |

\* Excludes external services (MongoDB Atlas, Neo4j Aura, etc.)

### Cost Optimization Strategies

#### 1. Use Spot Instances (EC2 Launch Type)

```bash
# Switch to EC2 launch type with Spot
# Save up to 70% on compute costs
```

#### 2. Optimize Task Sizing

```bash
# Right-size CPU and memory
CPU: 256 (instead of 512) = 50% savings
Memory: 512 MB (instead of 1024 MB) = 50% savings
```

#### 3. Use Fargate Spot

```bash
aws ecs create-service \
  --capacity-provider-strategy \
    capacityProvider=FARGATE_SPOT,weight=1,base=0
```

#### 4. Implement Auto-Scaling

Only run necessary capacity:

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/docuthinker-cluster/backend-service \
  --min-capacity 1 \
  --max-capacity 4
```

#### 5. Use VPC Endpoints

Eliminate NAT Gateway costs for AWS service traffic:

```bash
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-xxxxx \
  --service-name com.amazonaws.us-east-1.s3 \
  --route-table-ids rtb-xxxxx
```

#### 6. CloudWatch Logs Retention

Reduce log retention period:

```bash
aws logs put-retention-policy \
  --log-group-name /ecs/docuthinker-backend \
  --retention-in-days 7  # Instead of 30
```

#### 7. Use Reserved Capacity (EC2)

For predictable workloads, purchase reserved instances:

- **1-year commitment**: ~40% savings
- **3-year commitment**: ~60% savings

---

## Scaling

### Horizontal Scaling (Auto-Scaling)

#### Configure Auto-Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/docuthinker-cluster/backend-service \
  --min-capacity 2 \
  --max-capacity 10

# Target tracking scaling policy (CPU)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/docuthinker-cluster/backend-service \
  --policy-name cpu-target-tracking \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'

# Target tracking scaling policy (Memory)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/docuthinker-cluster/backend-service \
  --policy-name memory-target-tracking \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 80.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
    }
  }'

# Request count scaling
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/docuthinker-cluster/backend-service \
  --policy-name request-count-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 1000.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget",
      "ResourceLabel": "app/docuthinker-alb/xxxxx/targetgroup/backend-tg/yyyyy"
    }
  }'
```

### Vertical Scaling

Update task definition with more resources:

```bash
# Update to 1 vCPU and 2 GB memory
aws ecs register-task-definition \
  --family docuthinker-backend \
  --cpu 1024 \
  --memory 2048 \
  --container-definitions file://container-def.json

# Update service
aws ecs update-service \
  --cluster docuthinker-cluster \
  --service backend-service \
  --task-definition docuthinker-backend:2 \
  --force-new-deployment
```

### Load Balancing Configuration

#### Connection Draining

```bash
aws elbv2 modify-target-group-attributes \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --attributes Key=deregistration_delay.timeout_seconds,Value=30
```

#### Sticky Sessions

```bash
aws elbv2 modify-target-group-attributes \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --attributes Key=stickiness.enabled,Value=true Key=stickiness.type,Value=lb_cookie
```

---

## Disaster Recovery

### Backup Strategy

#### 1. ECS Task Definition Versioning

Task definitions are versioned automatically:

```bash
# List all versions
aws ecs list-task-definitions --family-prefix docuthinker

# Rollback to previous version
aws ecs update-service \
  --cluster docuthinker-cluster \
  --service backend-service \
  --task-definition docuthinker-backend:1
```

#### 2. ECR Image Backup

```bash
# Enable cross-region replication
# Images are automatically replicated to backup region

# Manual backup
docker pull ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/docuthinker-backend:latest
docker tag ... backup-registry/...
docker push ...
```

#### 3. Configuration Backup

```bash
# Export CloudFormation stack
aws cloudformation get-template \
  --stack-name docuthinker-stack \
  --query TemplateBody > backup.yaml

# Export secrets (encrypted)
aws secretsmanager get-secret-value \
  --secret-id docuthinker/openai \
  --query SecretString > secrets-backup.json
```

### Multi-Region Deployment

#### Primary Region: us-east-1
#### Secondary Region: us-west-2

```bash
# Deploy to secondary region
export AWS_REGION=us-west-2
cdk deploy DocuThinkerStack --context env=dr

# Configure Route 53 failover
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXXXX \
  --change-batch file://failover-config.json
```

**failover-config.json**:
```json
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.docuthinker.ai",
      "Type": "A",
      "SetIdentifier": "Primary",
      "Failover": "PRIMARY",
      "AliasTarget": {
        "HostedZoneId": "Z35SXDOTRQ7X7K",
        "DNSName": "primary-alb.us-east-1.elb.amazonaws.com",
        "EvaluateTargetHealth": true
      }
    }
  }, {
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.docuthinker.ai",
      "Type": "A",
      "SetIdentifier": "Secondary",
      "Failover": "SECONDARY",
      "AliasTarget": {
        "HostedZoneId": "Z35SXDOTRQ7X7K",
        "DNSName": "secondary-alb.us-west-2.elb.amazonaws.com",
        "EvaluateTargetHealth": true
      }
    }
  }]
}
```

### RTO and RPO

| Scenario | RTO | RPO | Recovery Steps |
|----------|-----|-----|----------------|
| **Single Task Failure** | < 1 min | 0 | Auto-restart by ECS |
| **AZ Failure** | < 2 min | 0 | Auto-failover to other AZ |
| **Region Failure** | < 15 min | < 5 min | Manual Route 53 failover |
| **Complete Disaster** | < 1 hour | < 15 min | Redeploy from backup |

---

## Troubleshooting

### Common Issues

#### 1. Service Not Starting

**Symptoms**: Tasks keep restarting

**Diagnosis**:
```bash
# Check service events
aws ecs describe-services \
  --cluster docuthinker-cluster \
  --services backend-service

# Check task logs
aws logs tail /ecs/docuthinker-backend --follow

# Describe stopped tasks
aws ecs describe-tasks \
  --cluster docuthinker-cluster \
  --tasks task-id
```

**Common Causes**:
- Missing environment variables
- Incorrect secrets configuration
- Health check failures
- Insufficient memory/CPU
- Port conflicts

#### 2. High CPU/Memory Usage

**Diagnosis**:
```bash
# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=backend-service Name=ClusterName,Value=docuthinker-cluster \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

**Solutions**:
- Increase task resources (CPU/memory)
- Optimize application code
- Enable auto-scaling
- Add caching layer (Redis)

#### 3. Load Balancer Health Check Failures

**Diagnosis**:
```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:...

# Check ALB access logs
aws s3 ls s3://alb-logs-bucket/
```

**Solutions**:
- Verify `/health` endpoint is responding
- Adjust health check parameters (interval, timeout, threshold)
- Check security group rules
- Verify container port mapping

#### 4. Secrets Not Loading

**Error**: `Unable to fetch secrets from Secrets Manager`

**Diagnosis**:
```bash
# Verify secret exists
aws secretsmanager describe-secret --secret-id docuthinker/openai

# Check IAM permissions
aws iam get-role-policy --role-name ecsTaskExecutionRole --policy-name SecretsAccess
```

**Solutions**:
- Grant `secretsmanager:GetSecretValue` to task execution role
- Verify secret ARN in task definition
- Check VPC endpoints for Secrets Manager

#### 5. Image Pull Errors

**Error**: `CannotPullContainerError`

**Diagnosis**:
```bash
# Verify image exists
aws ecr describe-images --repository-name docuthinker-backend

# Check ECR permissions
aws ecr get-repository-policy --repository-name docuthinker-backend
```

**Solutions**:
- Verify image tag exists in ECR
- Grant ECR permissions to task execution role
- Check VPC endpoints for ECR

### Debug Commands

```bash
# SSH into running container (ECS Exec)
aws ecs execute-command \
  --cluster docuthinker-cluster \
  --task task-id \
  --container backend \
  --interactive \
  --command "/bin/bash"

# View task details
aws ecs describe-tasks \
  --cluster docuthinker-cluster \
  --tasks task-id \
  --include TAGS

# Check service scaling activity
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/docuthinker-cluster/backend-service

# Force new deployment
aws ecs update-service \
  --cluster docuthinker-cluster \
  --service backend-service \
  --force-new-deployment
```

---

## Best Practices

### Infrastructure as Code

✅ **Always use IaC** (CDK or CloudFormation)
✅ **Version control** all infrastructure code
✅ **Peer review** infrastructure changes
✅ **Test** infrastructure changes in dev/staging first
✅ **Document** all infrastructure decisions

### Container Best Practices

✅ **Use specific image tags** (not `latest`)
✅ **Scan images** for vulnerabilities
✅ **Minimize image size** (multi-stage builds)
✅ **Run as non-root user**
✅ **Use health checks** for all containers
✅ **Implement graceful shutdown**

### Security Best Practices

✅ **Principle of least privilege** for IAM roles
✅ **Rotate secrets** regularly
✅ **Enable encryption** at rest and in transit
✅ **Use private subnets** for ECS tasks
✅ **Enable VPC Flow Logs**
✅ **Implement WAF rules**
✅ **Regular security audits**

### Monitoring Best Practices

✅ **Set up CloudWatch alarms** for critical metrics
✅ **Enable Container Insights**
✅ **Implement distributed tracing** (X-Ray)
✅ **Monitor costs** with AWS Cost Explorer
✅ **Set up log aggregation**
✅ **Create dashboards** for key metrics

### Deployment Best Practices

✅ **Blue/Green deployments** for zero downtime
✅ **Automated rollback** on failures
✅ **Gradual rollout** (canary deployments)
✅ **Integration tests** before production
✅ **Backup before deployment**

---

## CI/CD Integration

### Jenkins Pipeline

**Jenkinsfile**:

```groovy
pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        BACKEND_REPO = 'docuthinker-backend'
        AIML_REPO = 'docuthinker-ai-ml'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm test'
                        }
                    }
                }
                stage('AI/ML Tests') {
                    steps {
                        dir('ai_ml') {
                            sh 'pytest'
                        }
                    }
                }
            }
        }

        stage('Build Images') {
            parallel {
                stage('Backend Image') {
                    steps {
                        script {
                            sh """
                                cd backend
                                docker build -t ${BACKEND_REPO}:${BUILD_NUMBER} .
                                docker tag ${BACKEND_REPO}:${BUILD_NUMBER} ${ECR_REGISTRY}/${BACKEND_REPO}:latest
                            """
                        }
                    }
                }
                stage('AI/ML Image') {
                    steps {
                        script {
                            sh """
                                cd ai_ml
                                docker build -t ${AIML_REPO}:${BUILD_NUMBER} .
                                docker tag ${AIML_REPO}:${BUILD_NUMBER} ${ECR_REGISTRY}/${AIML_REPO}:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Push to ECR') {
            steps {
                script {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        docker push ${ECR_REGISTRY}/${BACKEND_REPO}:latest
                        docker push ${ECR_REGISTRY}/${AIML_REPO}:latest
                    """
                }
            }
        }

        stage('Deploy to ECS') {
            steps {
                script {
                    sh """
                        aws ecs update-service --cluster docuthinker-cluster --service backend-service --force-new-deployment
                        aws ecs update-service --cluster docuthinker-cluster --service aiml-service --force-new-deployment
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    sh """
                        aws ecs wait services-stable --cluster docuthinker-cluster --services backend-service aiml-service
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed. Rolling back...'
            sh """
                aws ecs update-service --cluster docuthinker-cluster --service backend-service --task-definition docuthinker-backend:previous
                aws ecs update-service --cluster docuthinker-cluster --service aiml-service --task-definition docuthinker-ai-ml:previous
            """
        }
    }
}
```

### GitHub Actions

**.github/workflows/deploy.yml**:

```yaml
name: Deploy to AWS ECS

on:
  push:
    branches: [ main ]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY_BACKEND: docuthinker-backend
  ECR_REPOSITORY_AIML: docuthinker-ai-ml
  ECS_CLUSTER: docuthinker-cluster

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build, tag, and push backend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd backend
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG .
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:latest

    - name: Build, tag, and push AI/ML image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd ai_ml
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_AIML:$IMAGE_TAG .
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY_AIML:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY_AIML:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY_AIML:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY_AIML:latest

    - name: Deploy to ECS
      run: |
        aws ecs update-service --cluster $ECS_CLUSTER --service backend-service --force-new-deployment
        aws ecs update-service --cluster $ECS_CLUSTER --service aiml-service --force-new-deployment

    - name: Wait for services to stabilize
      run: |
        aws ecs wait services-stable --cluster $ECS_CLUSTER --services backend-service aiml-service
```

---

## Maintenance

### Regular Tasks

#### Daily
- ✅ Monitor CloudWatch alarms
- ✅ Check service health
- ✅ Review error logs

#### Weekly
- ✅ Review CloudWatch metrics
- ✅ Check cost reports
- ✅ Review security group rules
- ✅ Verify backup integrity

#### Monthly
- ✅ Rotate secrets
- ✅ Update base images
- ✅ Review IAM policies
- ✅ Optimize costs
- ✅ Update dependencies

#### Quarterly
- ✅ Disaster recovery testing
- ✅ Security audit
- ✅ Performance testing
- ✅ Capacity planning

### Update Procedures

#### Update Docker Images

```bash
# Build new images
docker build -t docuthinker-backend:v2.0 backend/
docker build -t docuthinker-ai-ml:v2.0 ai_ml/

# Push to ECR
docker tag docuthinker-backend:v2.0 ${ECR_REGISTRY}/docuthinker-backend:v2.0
docker push ${ECR_REGISTRY}/docuthinker-backend:v2.0

# Update service
aws ecs update-service \
  --cluster docuthinker-cluster \
  --service backend-service \
  --force-new-deployment
```

#### Update Infrastructure

```bash
# Using CDK
cd aws/infrastructure
npm install  # Update dependencies
cdk diff    # Preview changes
cdk deploy  # Apply changes

# Using CloudFormation
aws cloudformation update-stack \
  --stack-name docuthinker-stack \
  --template-body file://aws/cloudformation/fargate-service.yaml \
  --parameters file://parameters.json
```

---

## FAQ

### Q: How do I access logs from ECS containers?

**A**: Use CloudWatch Logs:
```bash
aws logs tail /ecs/docuthinker-backend --follow
```

### Q: How do I scale my services?

**A**: Update desired count:
```bash
aws ecs update-service \
  --cluster docuthinker-cluster \
  --service backend-service \
  --desired-count 4
```

### Q: Can I run this on EC2 instead of Fargate?

**A**: Yes, change launch type to EC2 and manage EC2 instances yourself. Fargate is recommended for ease of management.

### Q: How do I implement blue/green deployments?

**A**: Use AWS CodeDeploy with ECS:
```bash
aws deploy create-deployment \
  --application-name docuthinker-app \
  --deployment-group-name docuthinker-dg \
  --revision file://appspec.yaml
```

### Q: What's the estimated monthly cost?

**A**: Approximately **$220/month** for the AWS infrastructure (see [Cost Optimization](#cost-optimization) section). This excludes external services like MongoDB Atlas and Neo4j Aura.

### Q: How do I enable HTTPS?

**A**: Request an ACM certificate and add HTTPS listener to ALB (see [SSL/TLS Configuration](#ssltls-configuration)).

### Q: Can I deploy to multiple regions?

**A**: Yes, deploy the CDK/CloudFormation stack in each region and configure Route 53 for failover (see [Multi-Region Deployment](#multi-region-deployment)).

### Q: How do I debug a failing task?

**A**: Use ECS Exec to SSH into the container:
```bash
aws ecs execute-command \
  --cluster docuthinker-cluster \
  --task task-id \
  --container backend \
  --interactive \
  --command "/bin/bash"
```

---

**Made with ❤️ by [Son Nguyen](https://sonnguyenhoang.com)**
