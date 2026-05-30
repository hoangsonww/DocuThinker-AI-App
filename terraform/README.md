# DocuThinker Terraform Infrastructure

This directory contains Terraform configurations for deploying DocuThinker infrastructure on AWS.

## Overview

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public and private subnets
- **EKS**: Managed Kubernetes cluster with multiple node groups
- **RDS**: PostgreSQL database with automated backups
- **ElastiCache**: Redis cluster for caching
- **S3**: Buckets for uploads and backups
- **CloudFront**: CDN for static assets
- **Monitoring**: Prometheus, Grafana, and ELK stack
- **Secrets Manager**: Secure secret storage
- **WAF**: Web Application Firewall
- **Backup**: Automated backup solution

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0
3. kubectl for Kubernetes management
4. helm for Helm chart deployment

## Directory Structure

```
terraform/
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Variable definitions
├── outputs.tf              # Output definitions
├── terraform.tfvars.example # Example variable values
└── modules/
    ├── vpc/                # VPC module
    ├── eks/                # EKS module
    ├── rds/                # RDS module
    ├── elasticache/        # ElastiCache module
    ├── s3/                 # S3 module
    ├── cloudfront/         # CloudFront module
    ├── monitoring/         # Monitoring module
    ├── secrets-manager/    # Secrets Manager module
    ├── waf/                # WAF module
    └── backup/             # Backup module
```

## Usage

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Create terraform.tfvars

Copy the example file and update with your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set appropriate values for your environment.

### 3. Plan the deployment

```bash
terraform plan
```

### 4. Apply the configuration

```bash
terraform apply
```

### 5. Configure kubectl

After EKS cluster creation, configure kubectl:

```bash
aws eks update-kubeconfig --name <cluster-name> --region <region>
```

## Multi-Environment Setup

To manage multiple environments, use Terraform workspaces:

```bash
# Create workspaces
terraform workspace new dev
terraform workspace new staging
terraform workspace new production

# Switch between workspaces
terraform workspace select production

# Apply configuration
terraform apply -var-file="production.tfvars"
```

## State Management

The Terraform state is stored in S3 with DynamoDB for state locking. Ensure you create the S3 bucket and DynamoDB table before running Terraform:

```bash
# Create S3 bucket for state
aws s3 mb s3://docuthinker-terraform-state --region us-east-1

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name docuthinker-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Module Details

### VPC Module

Creates a VPC with:
- Public and private subnets across multiple AZs
- NAT gateways for outbound internet access
- VPC endpoints for S3

### EKS Module

Creates an EKS cluster with:
- Multiple node groups (on-demand and spot instances)
- Cluster autoscaling
- Essential add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI driver)

### RDS Module

Creates a PostgreSQL database with:
- Multi-AZ deployment (production)
- Automated backups
- Performance Insights
- CloudWatch logs export

### Monitoring Module

Sets up monitoring infrastructure for:
- Prometheus for metrics collection
- Grafana for visualization
- ELK stack for log aggregation

## Best Practices

1. **Always run `terraform plan` before `apply`**
2. **Use workspaces for different environments**
3. **Keep sensitive values in terraform.tfvars (gitignored)**
4. **Review state changes carefully**
5. **Use remote state with locking**
6. **Tag all resources appropriately**

## Outputs

After applying, Terraform will output important information:

```bash
terraform output
```

This includes:
- VPC ID
- EKS cluster endpoint
- RDS endpoint
- CloudFront distribution URL
- Monitoring endpoints

## Cleanup

To destroy all infrastructure:

```bash
terraform destroy
```

**Warning**: This will delete all resources. Make sure you have backups!

## Cost Optimization

- Use spot instances for non-critical workloads
- Right-size instance types based on actual usage
- Enable autoscaling for EKS node groups
- Use lifecycle policies for S3 to transition old data to cheaper storage classes
- Review and adjust RDS instance size and storage

## Security

- All data is encrypted at rest and in transit
- Secrets are stored in AWS Secrets Manager
- WAF protects against common web exploits
- Security groups follow principle of least privilege
- VPC endpoints used where possible to avoid internet routing

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.
