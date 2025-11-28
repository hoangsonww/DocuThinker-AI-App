#!/bin/bash

# Velero Installation Script for Kubernetes Backup and DR
# Provides automated backup, restore, and disaster recovery capabilities

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
VELERO_VERSION="${1:-v1.12.0}"
AWS_REGION="${2:-us-east-1}"
BUCKET_NAME="${3:-docuthinker-velero-backups}"
NAMESPACE="velero"

print_info "Installing Velero ${VELERO_VERSION}..."

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl not found"
    exit 1
fi

# Download velero CLI
if ! command -v velero &> /dev/null; then
    print_info "Installing Velero CLI..."
    curl -L https://github.com/vmware-tanzu/velero/releases/download/${VELERO_VERSION}/velero-${VELERO_VERSION}-linux-amd64.tar.gz | tar -xz
    sudo mv velero-${VELERO_VERSION}-linux-amd64/velero /usr/local/bin/
fi

# Create S3 bucket for backups (if using AWS)
print_info "Creating S3 bucket: ${BUCKET_NAME}..."
aws s3 mb s3://${BUCKET_NAME} --region ${AWS_REGION} 2>/dev/null || print_warning "Bucket may already exist"

# Create IAM policy for Velero
cat > velero-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeVolumes",
                "ec2:DescribeSnapshots",
                "ec2:CreateTags",
                "ec2:CreateVolume",
                "ec2:CreateSnapshot",
                "ec2:DeleteSnapshot"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObject",
                "s3:AbortMultipartUpload",
                "s3:ListMultipartUploadParts"
            ],
            "Resource": ["arn:aws:s3:::${BUCKET_NAME}/*"]
        },
        {
            "Effect": "Allow",
            "Action": ["s3:ListBucket"],
            "Resource": ["arn:aws:s3:::${BUCKET_NAME}"]
        }
    ]
}
EOF

# Install Velero with AWS plugin
print_info "Installing Velero..."
velero install \
    --provider aws \
    --plugins velero/velero-plugin-for-aws:v1.8.0 \
    --bucket ${BUCKET_NAME} \
    --backup-location-config region=${AWS_REGION} \
    --snapshot-location-config region=${AWS_REGION} \
    --use-node-agent \
    --use-volume-snapshots=true \
    --wait

# Create backup schedules
print_info "Creating backup schedules..."

# Daily full backup
velero schedule create daily-backup \
    --schedule="0 2 * * *" \
    --include-namespaces docuthinker-prod \
    --ttl 720h

# Hourly incremental backup
velero schedule create hourly-backup \
    --schedule="0 * * * *" \
    --include-namespaces docuthinker-prod \
    --include-resources pods,deployments,services,configmaps,secrets \
    --ttl 168h

print_info "Velero installation complete!"
print_info "Create backup: velero backup create <name> --include-namespaces docuthinker-prod"
print_info "Restore backup: velero restore create --from-backup <backup-name>"
