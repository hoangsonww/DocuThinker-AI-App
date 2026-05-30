variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "coralogix_api_key" {
  description = "Coralogix Send-Your-Data API key"
  type        = string
  sensitive   = true
}

variable "coralogix_domain" {
  description = "Coralogix domain (e.g., coralogix.com, eu2.coralogix.com, coralogix.in)"
  type        = string
  default     = "coralogix.com"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS account ID for enrichment mapping"
  type        = string
  default     = ""
}

variable "slack_critical_integration_id" {
  description = "Coralogix Slack integration ID for critical alerts"
  type        = string
  default     = ""
}

variable "slack_alerts_integration_id" {
  description = "Coralogix Slack integration ID for warning alerts"
  type        = string
  default     = ""
}

variable "pagerduty_integration_id" {
  description = "Coralogix PagerDuty integration ID"
  type        = string
  default     = ""
}

variable "slack_critical_webhook_url" {
  description = "Slack webhook URL for critical alerts channel"
  type        = string
  sensitive   = true
  default     = ""
}

variable "slack_alerts_webhook_url" {
  description = "Slack webhook URL for general alerts channel"
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

variable "enable_s3_archive" {
  description = "Enable S3 archive for long-term log retention"
  type        = bool
  default     = true
}

variable "archive_s3_bucket" {
  description = "S3 bucket name for Coralogix log archive"
  type        = string
  default     = ""
}
