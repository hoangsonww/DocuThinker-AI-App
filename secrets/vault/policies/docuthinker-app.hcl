# Policy for DocuThinker application to read secrets

# Database credentials
path "secret/data/docuthinker/database/*" {
  capabilities = ["read", "list"]
}

# API keys
path "secret/data/docuthinker/api-keys/*" {
  capabilities = ["read", "list"]
}

# Redis credentials
path "secret/data/docuthinker/redis/*" {
  capabilities = ["read", "list"]
}

# Firebase credentials
path "secret/data/docuthinker/firebase/*" {
  capabilities = ["read", "list"]
}

# Google AI credentials
path "secret/data/docuthinker/google-ai/*" {
  capabilities = ["read", "list"]
}

# Application configuration
path "secret/data/docuthinker/config/*" {
  capabilities = ["read", "list"]
}

# TLS certificates
path "pki/issue/docuthinker" {
  capabilities = ["create", "update"]
}

# Dynamic database credentials
path "database/creds/docuthinker-role" {
  capabilities = ["read"]
}
