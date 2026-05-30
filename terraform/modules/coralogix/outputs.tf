output "tco_policy_ids" {
  description = "IDs of Coralogix TCO policies"
  value = {
    high_priority_logs   = coralogix_tco_policy_logs.high_priority.id
    medium_priority_logs = coralogix_tco_policy_logs.medium_priority.id
    low_priority_logs    = coralogix_tco_policy_logs.low_priority.id
    block_health_checks  = coralogix_tco_policy_logs.block_health_checks.id
    high_priority_spans  = coralogix_tco_policy_traces.high_priority_spans.id
    medium_priority_spans = coralogix_tco_policy_traces.medium_priority_spans.id
  }
}

output "recording_rules_id" {
  description = "ID of the recording rules group set"
  value       = coralogix_recording_rules_groups_set.docuthinker.id
}

output "alert_ids" {
  description = "IDs of Coralogix alerts"
  value = {
    high_error_rate        = coralogix_alert.high_error_rate.id
    high_latency_p95       = coralogix_alert.high_latency_p95.id
    error_budget_fast_burn = coralogix_alert.error_budget_fast_burn.id
    pod_crash_looping      = coralogix_alert.pod_crash_looping.id
    api_endpoint_down      = coralogix_alert.api_endpoint_down.id
    availability_slo       = coralogix_alert.availability_slo_violation.id
  }
}

output "webhook_ids" {
  description = "IDs of Coralogix webhooks"
  value = {
    slack_critical = length(coralogix_webhook.slack_critical) > 0 ? coralogix_webhook.slack_critical[0].id : null
    slack_alerts   = length(coralogix_webhook.slack_alerts) > 0 ? coralogix_webhook.slack_alerts[0].id : null
    pagerduty      = length(coralogix_webhook.pagerduty) > 0 ? coralogix_webhook.pagerduty[0].id : null
  }
}

output "archive_id" {
  description = "ID of the S3 archive configuration"
  value       = var.enable_s3_archive ? coralogix_archive_logs.s3_archive[0].id : null
}
