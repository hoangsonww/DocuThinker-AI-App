resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-docuthinker-db-subnet"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.environment}-docuthinker-db-subnet"
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.environment}-docuthinker-rds-sg"
  description = "Security group for RDS"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.selected.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-docuthinker-rds-sg"
  }
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.environment}-docuthinker-pg"
  family = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_duration"
    value = "1"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.environment}-docuthinker-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2

  db_name  = var.database_name
  username = var.master_username
  password = var.master_password
  port     = 5432

  multi_az               = var.multi_az
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  storage_encrypted = true
  deletion_protection = var.environment == "production" ? true : false
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.environment}-docuthinker-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  performance_insights_enabled = true
  performance_insights_retention_period = 7

  tags = {
    Name = "${var.environment}-docuthinker-db"
  }
}

data "aws_vpc" "selected" {
  id = var.vpc_id
}
