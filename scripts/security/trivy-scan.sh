#!/bin/bash
set -e

echo "Running Trivy security scans..."

REPORT_DIR="./security-reports"
mkdir -p "$REPORT_DIR"

# Scan filesystem for vulnerabilities
echo "Scanning filesystem..."
trivy fs \
  --severity CRITICAL,HIGH,MEDIUM \
  --format json \
  --output "$REPORT_DIR/filesystem-scan.json" \
  .

# Scan Docker images
echo "Scanning Docker images..."

IMAGES=(
  "docuthinker/frontend:latest"
  "docuthinker/backend:latest"
)

for IMAGE in "${IMAGES[@]}"; do
  IMAGE_NAME=$(echo "$IMAGE" | tr '/:' '_')
  echo "Scanning $IMAGE..."

  trivy image \
    --severity CRITICAL,HIGH \
    --format json \
    --output "$REPORT_DIR/${IMAGE_NAME}-scan.json" \
    "$IMAGE"

  trivy image \
    --severity CRITICAL,HIGH \
    --format table \
    "$IMAGE"
done

# Scan Kubernetes manifests
echo "Scanning Kubernetes manifests..."
trivy config \
  --severity CRITICAL,HIGH,MEDIUM \
  --format json \
  --output "$REPORT_DIR/kubernetes-scan.json" \
  ./kubernetes

# Scan Terraform files
if [ -d "./terraform" ]; then
  echo "Scanning Terraform files..."
  trivy config \
    --severity CRITICAL,HIGH,MEDIUM \
    --format json \
    --output "$REPORT_DIR/terraform-scan.json" \
    ./terraform
fi

# Generate summary report
echo "Generating summary report..."
cat > "$REPORT_DIR/summary.txt" << EOF
Trivy Security Scan Summary
Generated: $(date)

Files scanned:
- Filesystem vulnerabilities
- Docker images: ${IMAGES[@]}
- Kubernetes manifests
- Terraform configurations

Reports available in: $REPORT_DIR/

Critical and High severity findings require immediate attention.
EOF

echo "Trivy scans complete! Reports saved to $REPORT_DIR/"
