variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "docuthinker-eks"
}

variable "eks_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "database_name" {
  description = "Name of the RDS database"
  type        = string
  default     = "docuthinker"
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS (GB)"
  type        = number
  default     = 100
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for CloudFront"
  type        = string
  default     = ""
}

variable "cloudfront_domain_name" {
  description = "Custom domain name for CloudFront"
  type        = string
  default     = ""
}

variable "google_ai_api_key" {
  description = "Google AI API key"
  type        = string
  sensitive   = true
}

variable "firebase_api_key" {
  description = "Firebase API key"
  type        = string
  sensitive   = true
}

# ──────────────────────────────────────────────────────────────
# Coralogix Variables
# ──────────────────────────────────────────────────────────────

variable "coralogix_api_key" {
  description = "Coralogix Send-Your-Data API key"
  type        = string
  sensitive   = true
}

variable "coralogix_domain" {
  description = "Coralogix domain (coralogix.com, eu2.coralogix.com, coralogix.in, etc.)"
  type        = string
  default     = "coralogix.com"
}

variable "slack_critical_webhook_url" {
  description = "Slack webhook URL for critical alerts"
  type        = string
  sensitive   = true
  default     = ""
}

variable "slack_alerts_webhook_url" {
  description = "Slack webhook URL for general alerts"
  type        = string
  sensitive   = true
  default     = ""
}

variable "pagerduty_service_key" {
  description = "PagerDuty service key for alert routing"
  type        = string
  sensitive   = true
  default     = ""
}

variable "coralogix_slack_critical_integration_id" {
  description = "Coralogix Slack integration ID for critical alerts"
  type        = string
  default     = ""
}

variable "coralogix_slack_alerts_integration_id" {
  description = "Coralogix Slack integration ID for warning alerts"
  type        = string
  default     = ""
}

variable "coralogix_pagerduty_integration_id" {
  description = "Coralogix PagerDuty integration ID"
  type        = string
  default     = ""
}
