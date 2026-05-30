output "endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "arn" {
  description = "RDS ARN"
  value       = aws_db_instance.main.arn
}

output "port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.rds.id
}
