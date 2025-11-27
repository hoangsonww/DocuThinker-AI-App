terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket         = "docuthinker-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "docuthinker-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "DocuThinker"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "Engineering"
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      module.eks.cluster_name
    ]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args = [
        "eks",
        "get-token",
        "--cluster-name",
        module.eks.cluster_name
      ]
    }
  }
}

module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
}

module "eks" {
  source = "./modules/eks"

  environment        = var.environment
  cluster_name       = var.cluster_name
  cluster_version    = var.eks_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  node_groups = {
    general = {
      desired_size = 2
      min_size     = 1
      max_size     = 4
      instance_types = ["t3.medium"]
      capacity_type = "ON_DEMAND"
    }
    spot = {
      desired_size = 1
      min_size     = 0
      max_size     = 3
      instance_types = ["t3.medium", "t3a.medium"]
      capacity_type = "SPOT"
    }
  }
}

module "rds" {
  source = "./modules/rds"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  database_name           = var.database_name
  master_username         = var.db_username
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  multi_az                = var.environment == "production" ? true : false
  backup_retention_period = var.environment == "production" ? 30 : 7
}

module "elasticache" {
  source = "./modules/elasticache"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_type          = var.redis_node_type
  num_cache_nodes    = var.environment == "production" ? 2 : 1
}

module "s3" {
  source = "./modules/s3"

  environment = var.environment
  buckets = {
    uploads = {
      versioning_enabled = true
      lifecycle_rules = [
        {
          enabled = true
          id      = "archive-old-uploads"
          transition = {
            days          = 90
            storage_class = "GLACIER"
          }
        }
      ]
    }
    backups = {
      versioning_enabled = true
      lifecycle_rules = [
        {
          enabled = true
          id      = "expire-old-backups"
          expiration = {
            days = 365
          }
        }
      ]
    }
  }
}

module "cloudfront" {
  source = "./modules/cloudfront"

  environment       = var.environment
  s3_bucket_id      = module.s3.bucket_ids["uploads"]
  s3_bucket_domain  = module.s3.bucket_domain_names["uploads"]
  acm_certificate_arn = var.acm_certificate_arn
  domain_name       = var.cloudfront_domain_name
}

module "monitoring" {
  source = "./modules/monitoring"

  environment    = var.environment
  cluster_name   = module.eks.cluster_name
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  enable_prometheus = true
  enable_grafana    = true
  enable_elk_stack  = true
}

module "secrets_manager" {
  source = "./modules/secrets-manager"

  environment = var.environment
  secrets = {
    database_credentials = {
      description = "RDS database credentials"
      secret_string = jsonencode({
        username = var.db_username
        password = var.db_password
        endpoint = module.rds.endpoint
        database = var.database_name
      })
    }
    redis_credentials = {
      description = "ElastiCache Redis credentials"
      secret_string = jsonencode({
        endpoint = module.elasticache.endpoint
        port     = module.elasticache.port
      })
    }
    api_keys = {
      description = "API keys for external services"
      secret_string = jsonencode({
        google_ai_key = var.google_ai_api_key
        firebase_key  = var.firebase_api_key
      })
    }
  }
}

module "waf" {
  source = "./modules/waf"

  environment     = var.environment
  cloudfront_arn  = module.cloudfront.distribution_arn
  rate_limit      = 2000
  enable_geo_blocking = true
  blocked_countries   = ["CN", "RU"]
}

module "backup" {
  source = "./modules/backup"

  environment    = var.environment
  rds_arn        = module.rds.arn
  s3_bucket_arns = [for bucket in module.s3.bucket_arns : bucket]
  backup_schedule = "cron(0 2 * * ? *)"
  retention_days  = var.environment == "production" ? 30 : 7
}
