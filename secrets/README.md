# Secret Management

DocuThinker uses multiple secret management solutions for different use cases:

## Solutions

### 1. HashiCorp Vault
- **Use Case**: Primary secret storage, dynamic secrets, PKI
- **Deployment**: Kubernetes-native with HA Raft storage
- **Features**:
  - Dynamic database credentials
  - Secret rotation
  - Audit logging
  - PKI for certificate management

### 2. AWS Secrets Manager
- **Use Case**: AWS-specific secrets, integration with AWS services
- **Features**:
  - Automatic rotation
  - Fine-grained IAM policies
  - Cross-region replication

### 3. External Secrets Operator
- **Use Case**: Sync secrets from Vault/AWS to Kubernetes
- **Features**:
  - Automatic sync
  - Multiple backend support
  - GitOps-friendly

## Installation

### Prerequisites
```bash
# Add Helm repositories
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
```

### Install Vault

```bash
# Create namespace
kubectl create namespace vault

# Install Vault
helm install vault hashicorp/vault \
  --namespace vault \
  --values secrets/vault/vault-values.yaml

# Initialize Vault
chmod +x secrets/vault/init-vault.sh
./secrets/vault/init-vault.sh
```

### Install External Secrets Operator

```bash
helm install external-secrets \
  external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace

# Apply secret stores and external secrets
kubectl apply -f secrets/external-secrets/secret-store.yaml
```

## Usage

### Accessing Secrets in Applications

#### Method 1: Vault Sidecar Injection

Add annotations to your deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "docuthinker"
        vault.hashicorp.com/agent-inject-secret-database: "secret/data/docuthinker/database/credentials"
        vault.hashicorp.com/agent-inject-template-database: |
          {{- with secret "secret/data/docuthinker/database/credentials" -}}
          export DB_HOST="{{ .Data.data.host }}"
          export DB_PORT="{{ .Data.data.port }}"
          export DB_USER="{{ .Data.data.username }}"
          export DB_PASSWORD="{{ .Data.data.password }}"
          export DB_NAME="{{ .Data.data.database }}"
          {{- end -}}
```

#### Method 2: External Secrets (Recommended)

Secrets are automatically synced to Kubernetes Secrets:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    spec:
      containers:
        - name: backend
          env:
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: database-credentials
                  key: host
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: database-credentials
                  key: password
```

#### Method 3: CSI Driver

Mount secrets as files:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    spec:
      volumes:
        - name: secrets
          csi:
            driver: secrets-store.csi.k8s.io
            readOnly: true
            volumeAttributes:
              secretProviderClass: "vault-database"
      containers:
        - name: backend
          volumeMounts:
            - name: secrets
              mountPath: "/mnt/secrets"
              readOnly: true
```

### Managing Secrets

#### Add a new secret to Vault

```bash
vault kv put secret/docuthinker/new-service/credentials \
  api_key=your-api-key \
  api_secret=your-api-secret
```

#### Read a secret

```bash
vault kv get secret/docuthinker/database/credentials
```

#### Update a secret

```bash
vault kv patch secret/docuthinker/database/credentials \
  password=new-password
```

#### Delete a secret

```bash
vault kv delete secret/docuthinker/database/credentials
```

### Dynamic Database Credentials

Request dynamic credentials:

```bash
vault read database/creds/docuthinker-role
```

This creates temporary credentials that auto-expire.

## Secret Rotation

### Automatic Rotation (AWS Secrets Manager)

Configured in Terraform:

```hcl
resource "aws_secretsmanager_secret_rotation" "example" {
  secret_id           = aws_secretsmanager_secret.docuthinker.id
  rotation_lambda_arn = aws_lambda_function.rotate.arn

  rotation_rules {
    automatically_after_days = 30
  }
}
```

### Manual Rotation (Vault)

```bash
# Rotate database root credentials
vault write -f database/rotate-root/docuthinker-postgres

# Generate new credentials
vault read database/creds/docuthinker-role
```

## Backup and Recovery

### Backup Vault Data

```bash
kubectl exec -n vault vault-0 -- vault operator raft snapshot save backup.snap
kubectl cp vault/vault-0:backup.snap ./vault-backup-$(date +%Y%m%d).snap
```

### Restore Vault Data

```bash
kubectl cp ./vault-backup.snap vault/vault-0:/tmp/backup.snap
kubectl exec -n vault vault-0 -- vault operator raft snapshot restore /tmp/backup.snap
```

## Security Best Practices

1. **Never commit secrets to Git**
   - Use `.gitignore` for `vault-keys.json` and similar files

2. **Rotate secrets regularly**
   - Database credentials: every 30 days
   - API keys: every 90 days
   - Root tokens: immediately after initial setup

3. **Use least privilege**
   - Create specific policies for each application
   - Limit secret access to required paths only

4. **Enable audit logging**
   ```bash
   vault audit enable file file_path=/vault/logs/audit.log
   ```

5. **Monitor secret access**
   - Review Vault audit logs regularly
   - Set up alerts for unusual access patterns

6. **Use dynamic secrets when possible**
   - Prefer dynamic database credentials over static ones
   - Set appropriate TTLs

7. **Secure Vault unsealing**
   - Use auto-unseal with AWS KMS (configured in values.yaml)
   - Never store unseal keys in the same location as Vault

## Troubleshooting

### Vault is sealed

```bash
# Check status
kubectl exec -n vault vault-0 -- vault status

# Unseal manually
kubectl exec -n vault vault-0 -- vault operator unseal <unseal-key>
```

### External Secrets not syncing

```bash
# Check operator logs
kubectl logs -n external-secrets -l app.kubernetes.io/name=external-secrets

# Check ExternalSecret status
kubectl describe externalsecret docuthinker-database-credentials -n docuthinker-prod
```

### Vault policy issues

```bash
# Test policy
vault policy read docuthinker-app

# Debug auth
vault token lookup
```

## Monitoring

Vault metrics are exposed to Prometheus:

```yaml
# Query Vault metrics in Prometheus
vault_core_unsealed
vault_core_active
vault_secret_kv_count
```

## Migration Guide

### From Kubernetes Secrets to Vault

1. Export existing secrets
2. Import to Vault
3. Create ExternalSecret resources
4. Update deployments to use new secret names
5. Delete old Kubernetes secrets

```bash
# Export
kubectl get secret my-secret -o yaml > my-secret.yaml

# Import to Vault
vault kv put secret/docuthinker/my-secret @my-secret.json

# Create ExternalSecret (see examples above)

# Update deployment
kubectl set env deployment/my-app --from=secret/my-secret

# Verify
kubectl rollout status deployment/my-app

# Delete old secret
kubectl delete secret my-secret
```

## Support

For issues with secret management:
1. Check Vault/External Secrets logs
2. Verify policies and roles
3. Ensure network connectivity
4. Review audit logs for access denials
