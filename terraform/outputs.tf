output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "Security group ID of the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = module.rds.endpoint
  sensitive   = true
}

output "rds_arn" {
  description = "ARN of the RDS instance"
  value       = module.rds.arn
}

output "elasticache_endpoint" {
  description = "Endpoint of the ElastiCache cluster"
  value       = module.elasticache.endpoint
  sensitive   = true
}

output "s3_bucket_ids" {
  description = "IDs of S3 buckets"
  value       = module.s3.bucket_ids
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.cloudfront.distribution_domain_name
}

output "secrets_manager_arns" {
  description = "ARNs of secrets in Secrets Manager"
  value       = module.secrets_manager.secret_arns
  sensitive   = true
}

output "monitoring_prometheus_endpoint" {
  description = "Prometheus endpoint URL"
  value       = module.monitoring.prometheus_endpoint
}

output "monitoring_grafana_endpoint" {
  description = "Grafana endpoint URL"
  value       = module.monitoring.grafana_endpoint
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = module.waf.web_acl_id
}
