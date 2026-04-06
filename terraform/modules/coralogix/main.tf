# Coralogix Observability Platform Integration
# Terraform module for managing Coralogix resources via IaC

terraform {
  required_providers {
    coralogix = {
      source  = "coralogix/coralogix"
      version = "~> 2.0"
    }
  }
}

provider "coralogix" {
  api_key = var.coralogix_api_key
  env     = var.coralogix_domain
}

# ──────────────────────────────────────────────────────────────
# TCO Policies — Control data ingestion tiers for cost optimization
# ──────────────────────────────────────────────────────────────

resource "coralogix_tco_policy_logs" "high_priority" {
  name        = "DocuThinker — High Priority Logs"
  description = "Application errors and critical business logs — frequent search tier"
  priority    = "high"
  order       = 1
  enabled     = true

  severities = ["error", "critical"]

  applications {
    rule_type = "is"
    names     = ["docuthinker"]
  }

  subsystems {
    rule_type = "starts_with"
    names     = ["production", "backend"]
  }
}

resource "coralogix_tco_policy_logs" "medium_priority" {
  name        = "DocuThinker — Medium Priority Logs"
  description = "Application warnings and info-level business logs — monitoring tier"
  priority    = "medium"
  order       = 2
  enabled     = true

  severities = ["warning", "info"]

  applications {
    rule_type = "is"
    names     = ["docuthinker"]
  }

  subsystems {
    rule_type = "starts_with"
    names     = ["production", "backend", "frontend"]
  }
}

resource "coralogix_tco_policy_logs" "low_priority" {
  name        = "DocuThinker — Low Priority Logs"
  description = "Debug/verbose K8s infrastructure logs — compliance/archive tier"
  priority    = "low"
  order       = 3
  enabled     = true

  severities = ["debug", "verbose"]

  applications {
    rule_type = "is"
    names     = ["docuthinker"]
  }

  subsystems {
    rule_type = "starts_with"
    names     = ["kubernetes"]
  }
}

resource "coralogix_tco_policy_logs" "block_health_checks" {
  name        = "DocuThinker — Block Health Checks"
  description = "Health check logs — blocked from ingestion to reduce noise"
  priority    = "block"
  order       = 0
  enabled     = true

  severities = ["debug", "verbose", "info"]

  applications {
    rule_type = "is"
    names     = ["docuthinker"]
  }

  subsystems {
    rule_type = "is"
    names     = ["healthcheck"]
  }
}

resource "coralogix_tco_policy_traces" "high_priority_spans" {
  name        = "DocuThinker — High Priority Spans"
  description = "Error spans — frequent search tier"
  priority    = "high"
  order       = 1
  enabled     = true

  applications {
    rule_type = "is"
    names     = ["docuthinker"]
  }

  actions {
    rule_type = "is_not"
    names     = ["healthcheck"]
  }

  tags {
    tags {
      name = "otel.status_code"
      rule_type {
        is {
          values = ["ERROR"]
        }
      }
    }
  }
}

resource "coralogix_tco_policy_traces" "medium_priority_spans" {
  name        = "DocuThinker — Medium Priority Spans"
  description = "Normal spans — monitoring tier"
  priority    = "medium"
  order       = 2
  enabled     = true

  applications {
    rule_type = "is"
    names     = ["docuthinker"]
  }

  actions {
    rule_type = "is_not"
    names     = ["healthcheck"]
  }
}

# ──────────────────────────────────────────────────────────────
# Recording Rule Groups — Pre-aggregated metrics for dashboards
# ──────────────────────────────────────────────────────────────

resource "coralogix_recording_rules_groups_set" "docuthinker" {
  name = "docuthinker-recording-rules"

  group {
    name     = "docuthinker_availability"
    interval = 60

    rule {
      record = "cx:docuthinker:success_rate:5m"
      expr   = "sum(rate(http_requests_total{status_code!~\"5..\"}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)"
      labels = {
        application = "docuthinker"
        environment = var.environment
      }
    }

    rule {
      record = "cx:docuthinker:error_rate:5m"
      expr   = "sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)"
      labels = {
        application = "docuthinker"
        environment = var.environment
      }
    }
  }

  group {
    name     = "docuthinker_latency"
    interval = 60

    rule {
      record = "cx:docuthinker:latency:p50_5m"
      expr   = "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))"
      labels = {
        application = "docuthinker"
        environment = var.environment
      }
    }

    rule {
      record = "cx:docuthinker:latency:p95_5m"
      expr   = "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))"
      labels = {
        application = "docuthinker"
        environment = var.environment
      }
    }

    rule {
      record = "cx:docuthinker:latency:p99_5m"
      expr   = "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))"
      labels = {
        application = "docuthinker"
        environment = var.environment
      }
    }
  }

  group {
    name     = "docuthinker_slo"
    interval = 60

    rule {
      record = "cx:docuthinker:slo:availability_30d"
      expr   = "sum(rate(http_requests_total{status_code!~\"5..\"}[30d])) by (service) / sum(rate(http_requests_total[30d])) by (service)"
      labels = {
        application = "docuthinker"
        slo_target  = "0.999"
      }
    }

    rule {
      record = "cx:docuthinker:slo:error_budget_remaining"
      expr   = "1 - ((1 - cx:docuthinker:slo:availability_30d) / (1 - 0.999))"
      labels = {
        application = "docuthinker"
        slo_target  = "0.999"
      }
    }

    rule {
      record = "cx:docuthinker:slo:burn_rate_1h"
      expr   = "(1 - cx:docuthinker:success_rate:5m) / (1 - 0.999)"
      labels = {
        application = "docuthinker"
        slo_target  = "0.999"
      }
    }
  }
}

# ──────────────────────────────────────────────────────────────
# Alerts — Coralogix-native alert definitions
# ──────────────────────────────────────────────────────────────

resource "coralogix_alert" "high_error_rate" {
  name        = "DocuThinker — High Error Rate"
  description = "HTTP 5xx error rate exceeds 5% for 5 minutes"
  severity    = "critical"
  enabled     = true

  notification_group {
    group_by_fields = ["service"]

    notification {
      integration_id   = var.slack_critical_integration_id
      notify_on        = "triggered_and_resolved"
      retriggering_period_minutes = 60
    }

    dynamic "notification" {
      for_each = var.pagerduty_integration_id != "" ? [1] : []
      content {
        integration_id   = var.pagerduty_integration_id
        notify_on        = "triggered_and_resolved"
      }
    }
  }

  metric {
    promql {
      search_query = "cx:docuthinker:error_rate:5m"
      conditions {
        alert_when                  = "more_than"
        threshold                   = 0.05
        sample_threshold_percentage = 0
        min_non_null_values_percentage = 0
        timeframe                   = "5_minutes"
      }
    }
  }

  meta_labels = {
    alert_type  = "slo"
    service     = "docuthinker"
    environment = var.environment
  }
}

resource "coralogix_alert" "high_latency_p95" {
  name        = "DocuThinker — High P95 Latency"
  description = "95th percentile response time exceeds 1s for 5 minutes"
  severity    = "warning"
  enabled     = true

  notification_group {
    group_by_fields = ["service"]

    notification {
      integration_id   = var.slack_alerts_integration_id
      notify_on        = "triggered_only"
      retriggering_period_minutes = 60
    }
  }

  metric {
    promql {
      search_query = "cx:docuthinker:latency:p95_5m"
      conditions {
        alert_when                  = "more_than"
        threshold                   = 1.0
        sample_threshold_percentage = 0
        min_non_null_values_percentage = 0
        timeframe                   = "5_minutes"
      }
    }
  }

  meta_labels = {
    alert_type  = "latency"
    service     = "docuthinker"
    environment = var.environment
  }
}

resource "coralogix_alert" "error_budget_fast_burn" {
  name        = "DocuThinker — Error Budget Fast Burn"
  description = "Error budget burn rate exceeds 14.4x (2% consumed in 1 hour)"
  severity    = "critical"
  enabled     = true

  notification_group {
    group_by_fields = ["service"]

    notification {
      integration_id   = var.slack_critical_integration_id
      notify_on        = "triggered_and_resolved"
      retriggering_period_minutes = 30
    }

    dynamic "notification" {
      for_each = var.pagerduty_integration_id != "" ? [1] : []
      content {
        integration_id   = var.pagerduty_integration_id
        notify_on        = "triggered_and_resolved"
      }
    }
  }

  metric {
    promql {
      search_query = "cx:docuthinker:slo:burn_rate_1h"
      conditions {
        alert_when                  = "more_than"
        threshold                   = 14.4
        sample_threshold_percentage = 0
        min_non_null_values_percentage = 0
        timeframe                   = "5_minutes"
      }
    }
  }

  meta_labels = {
    alert_type  = "slo"
    service     = "docuthinker"
    environment = var.environment
  }
}

resource "coralogix_alert" "pod_crash_looping" {
  name        = "DocuThinker — Pod CrashLooping"
  description = "A pod has restarted more than 3 times in 15 minutes"
  severity    = "critical"
  enabled     = true

  notification_group {
    group_by_fields = ["k8s.pod.name"]

    notification {
      integration_id   = var.slack_critical_integration_id
      notify_on        = "triggered_and_resolved"
      retriggering_period_minutes = 30
    }

    dynamic "notification" {
      for_each = var.pagerduty_integration_id != "" ? [1] : []
      content {
        integration_id   = var.pagerduty_integration_id
        notify_on        = "triggered_and_resolved"
      }
    }
  }

  standard {
    conditions {
      alert_when  = "more_than"
      threshold   = 3
      timeframe   = "15_minutes"
      group_by    = ["k8s.pod.name", "k8s.namespace.name"]
    }

    filters {
      text         = "reason:\"BackOff\" OR reason:\"CrashLoopBackOff\""
      filter_type  = "text"
      metadata {
        applications = ["docuthinker"]
        subsystems   = ["kubernetes-cluster"]
      }
    }
  }

  meta_labels = {
    alert_type  = "infrastructure"
    service     = "docuthinker"
    environment = var.environment
  }
}

resource "coralogix_alert" "api_endpoint_down" {
  name        = "DocuThinker — API Endpoint Down"
  description = "Backend API endpoint is unreachable for 1 minute"
  severity    = "critical"
  enabled     = true

  notification_group {
    notification {
      integration_id   = var.slack_critical_integration_id
      notify_on        = "triggered_and_resolved"
      retriggering_period_minutes = 15
    }

    dynamic "notification" {
      for_each = var.pagerduty_integration_id != "" ? [1] : []
      content {
        integration_id   = var.pagerduty_integration_id
        notify_on        = "triggered_and_resolved"
      }
    }
  }

  metric {
    promql {
      search_query = "up{job=\"docuthinker-backend\"}"
      conditions {
        alert_when                  = "less_than"
        threshold                   = 1
        sample_threshold_percentage = 0
        min_non_null_values_percentage = 0
        timeframe                   = "1_minute"
      }
    }
  }

  meta_labels = {
    alert_type  = "availability"
    service     = "docuthinker"
    environment = var.environment
  }
}

resource "coralogix_alert" "availability_slo_violation" {
  name        = "DocuThinker — Availability SLO Violation"
  description = "30-day availability has dropped below 99.9% SLO target"
  severity    = "critical"
  enabled     = true

  notification_group {
    group_by_fields = ["service"]

    notification {
      integration_id   = var.slack_critical_integration_id
      notify_on        = "triggered_and_resolved"
      retriggering_period_minutes = 60
    }

    dynamic "notification" {
      for_each = var.pagerduty_integration_id != "" ? [1] : []
      content {
        integration_id   = var.pagerduty_integration_id
        notify_on        = "triggered_and_resolved"
      }
    }
  }

  metric {
    promql {
      search_query = "cx:docuthinker:slo:availability_30d"
      conditions {
        alert_when                  = "less_than"
        threshold                   = 0.999
        sample_threshold_percentage = 0
        min_non_null_values_percentage = 0
        timeframe                   = "5_minutes"
      }
    }
  }

  meta_labels = {
    alert_type  = "slo"
    service     = "docuthinker"
    environment = var.environment
  }
}

# ──────────────────────────────────────────────────────────────
# S3 Archive — Ship logs to S3 for long-term retention
# ──────────────────────────────────────────────────────────────

resource "coralogix_archive_logs" "s3_archive" {
  count = var.enable_s3_archive ? 1 : 0

  active = true

  s3 {
    bucket = var.archive_s3_bucket
    region = var.aws_region
  }
}

# ──────────────────────────────────────────────────────────────
# Webhooks — Integration endpoints
# ──────────────────────────────────────────────────────────────

resource "coralogix_webhook" "slack_critical" {
  count = var.slack_critical_webhook_url != "" ? 1 : 0

  name = "DocuThinker Critical Alerts — Slack"
  type = "Slack"

  slack {
    url = var.slack_critical_webhook_url
  }
}

resource "coralogix_webhook" "slack_alerts" {
  count = var.slack_alerts_webhook_url != "" ? 1 : 0

  name = "DocuThinker Alerts — Slack"
  type = "Slack"

  slack {
    url = var.slack_alerts_webhook_url
  }
}

resource "coralogix_webhook" "pagerduty" {
  count = var.pagerduty_service_key != "" ? 1 : 0

  name = "DocuThinker — PagerDuty"
  type = "PagerDuty"

  pager_duty {
    service_key = var.pagerduty_service_key
  }
}

# ──────────────────────────────────────────────────────────────
# Enrichments — Custom enrichment for log context
# ──────────────────────────────────────────────────────────────

resource "coralogix_enrichment" "geo_ip" {
  geo_ip {
    fields {
      name = "client_ip"
    }
  }
}

resource "coralogix_enrichment" "aws_enrichment" {
  custom {
    fields {
      name = "aws_account"
    }

    file {
      name    = "aws-account-mapping"
      content = <<-EOT
        ${var.aws_account_id},docuthinker-${var.environment}
      EOT
    }
  }
}
