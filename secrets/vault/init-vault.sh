#!/bin/bash
set -e

echo "Initializing Vault..."

# Wait for Vault to be ready
until kubectl exec -n vault vault-0 -- vault status; do
  echo "Waiting for Vault to be ready..."
  sleep 5
done

# Initialize Vault (only on first run)
if ! kubectl exec -n vault vault-0 -- vault status | grep -q "Initialized.*true"; then
  echo "Initializing Vault cluster..."
  kubectl exec -n vault vault-0 -- vault operator init \
    -key-shares=5 \
    -key-threshold=3 \
    -format=json > vault-keys.json

  echo "Vault initialized. Keys saved to vault-keys.json"
  echo "IMPORTANT: Store these keys securely and delete this file!"
fi

# Unseal Vault (if sealed)
if kubectl exec -n vault vault-0 -- vault status | grep -q "Sealed.*true"; then
  echo "Unsealing Vault..."

  # Extract unseal keys
  UNSEAL_KEY_1=$(cat vault-keys.json | jq -r '.unseal_keys_b64[0]')
  UNSEAL_KEY_2=$(cat vault-keys.json | jq -r '.unseal_keys_b64[1]')
  UNSEAL_KEY_3=$(cat vault-keys.json | jq -r '.unseal_keys_b64[2]')

  # Unseal all Vault instances
  for i in 0 1 2; do
    kubectl exec -n vault vault-$i -- vault operator unseal $UNSEAL_KEY_1
    kubectl exec -n vault vault-$i -- vault operator unseal $UNSEAL_KEY_2
    kubectl exec -n vault vault-$i -- vault operator unseal $UNSEAL_KEY_3
  done
fi

# Get root token
ROOT_TOKEN=$(cat vault-keys.json | jq -r '.root_token')

# Login to Vault
kubectl exec -n vault vault-0 -- vault login $ROOT_TOKEN

echo "Enabling Kubernetes auth..."
kubectl exec -n vault vault-0 -- vault auth enable kubernetes || true

echo "Configuring Kubernetes auth..."
kubectl exec -n vault vault-0 -- vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc:443" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token

echo "Enabling KV secrets engine..."
kubectl exec -n vault vault-0 -- vault secrets enable -path=secret kv-v2 || true

echo "Enabling database secrets engine..."
kubectl exec -n vault vault-0 -- vault secrets enable database || true

echo "Enabling PKI secrets engine for certificates..."
kubectl exec -n vault vault-0 -- vault secrets enable pki || true
kubectl exec -n vault vault-0 -- vault secrets tune -max-lease-ttl=87600h pki

echo "Creating DocuThinker policy..."
kubectl exec -n vault vault-0 -- vault policy write docuthinker-app - < policies/docuthinker-app.hcl

echo "Creating Kubernetes role..."
kubectl exec -n vault vault-0 -- vault write auth/kubernetes/role/docuthinker \
  bound_service_account_names=docuthinker-backend,docuthinker-frontend \
  bound_service_account_namespaces=docuthinker-prod,docuthinker-staging,docuthinker-dev \
  policies=docuthinker-app \
  ttl=24h

echo "Configuring database secrets engine..."
kubectl exec -n vault vault-0 -- vault write database/config/docuthinker-postgres \
  plugin_name=postgresql-database-plugin \
  allowed_roles="docuthinker-role" \
  connection_url="postgresql://{{username}}:{{password}}@postgres.docuthinker.svc.cluster.local:5432/docuthinker?sslmode=require" \
  username="vault" \
  password="vault-password"

kubectl exec -n vault vault-0 -- vault write database/roles/docuthinker-role \
  db_name=docuthinker-postgres \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

echo "Setting up sample secrets..."
kubectl exec -n vault vault-0 -- vault kv put secret/docuthinker/database/credentials \
  username=dbuser \
  password=dbpassword \
  host=postgres.docuthinker.svc.cluster.local \
  port=5432 \
  database=docuthinker

kubectl exec -n vault vault-0 -- vault kv put secret/docuthinker/redis/credentials \
  host=redis.docuthinker.svc.cluster.local \
  port=6379

kubectl exec -n vault vault-0 -- vault kv put secret/docuthinker/api-keys/google-ai \
  api_key=YOUR_GOOGLE_AI_API_KEY

kubectl exec -n vault vault-0 -- vault kv put secret/docuthinker/api-keys/firebase \
  api_key=YOUR_FIREBASE_API_KEY

echo "Vault initialization complete!"
echo "Root token: $ROOT_TOKEN"
echo "Remember to revoke the root token after setting up admin users!"
