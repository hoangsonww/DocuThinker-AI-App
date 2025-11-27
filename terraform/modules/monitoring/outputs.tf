output "prometheus_endpoint" {
  description = "Prometheus endpoint"
  value       = var.enable_prometheus ? "http://prometheus.${var.environment}.docuthinker.local:9090" : ""
}

output "grafana_endpoint" {
  description = "Grafana endpoint"
  value       = var.enable_grafana ? "http://grafana.${var.environment}.docuthinker.local:3000" : ""
}

output "security_group_id" {
  description = "Monitoring security group ID"
  value       = aws_security_group.monitoring.id
}
