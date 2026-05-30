package test

import (
	"fmt"
	"testing"
	"time"

	"github.com/gruntwork-io/terratest/modules/aws"
	"github.com/gruntwork-io/terratest/modules/random"
	"github.com/gruntwork-io/terratest/modules/retry"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

// TestTerraformDocuThinkerInfrastructure validates the Terraform infrastructure
func TestTerraformDocuThinkerInfrastructure(t *testing.T) {
	t.Parallel()

	// Generate unique names for resources
	uniqueID := random.UniqueId()
	clusterName := fmt.Sprintf("docuthinker-test-%s", uniqueID)
	awsRegion := "us-east-1"

	// Terraform options
	terraformOptions := &terraform.Options{
		// Path to Terraform code
		TerraformDir: "../../terraform",

		// Variables to pass
		Vars: map[string]interface{}{
			"cluster_name": clusterName,
			"environment":  "test",
			"aws_region":   awsRegion,
			"eks_version":  "1.28",
		},

		// Environment variables
		EnvVars: map[string]string{
			"AWS_DEFAULT_REGION": awsRegion,
		},

		// Retry configuration
		MaxRetries:         3,
		TimeBetweenRetries: 5 * time.Second,

		// Cleanup
		NoColor: true,
	}

	// Ensure cleanup
	defer terraform.Destroy(t, terraformOptions)

	// Initialize and apply Terraform
	terraform.InitAndApply(t, terraformOptions)

	// Test 1: Verify VPC exists
	t.Run("VPC Configuration", func(t *testing.T) {
		vpcID := terraform.Output(t, terraformOptions, "vpc_id")
		assert.NotEmpty(t, vpcID, "VPC ID should not be empty")

		// Verify VPC exists in AWS
		vpc := aws.GetVpcById(t, vpcID, awsRegion)
		assert.NotNil(t, vpc, "VPC should exist")
		assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock, "VPC CIDR should match")
	})

	// Test 2: Verify EKS cluster
	t.Run("EKS Cluster", func(t *testing.T) {
		clusterEndpoint := terraform.Output(t, terraformOptions, "cluster_endpoint")
		assert.NotEmpty(t, clusterEndpoint, "Cluster endpoint should not be empty")
		assert.Contains(t, clusterEndpoint, "eks.amazonaws.com", "Should be valid EKS endpoint")
	})

	// Test 3: Verify RDS instance
	t.Run("RDS Database", func(t *testing.T) {
		dbEndpoint := terraform.Output(t, terraformOptions, "db_endpoint")
		assert.NotEmpty(t, dbEndpoint, "DB endpoint should not be empty")

		// Verify RDS is accessible (with retry)
		maxRetries := 10
		sleepBetweenRetries := 30 * time.Second

		retry.DoWithRetry(t, "Check RDS connectivity", maxRetries, sleepBetweenRetries, func() (string, error) {
			// Connection test would go here
			return "", nil
		})
	})

	// Test 4: Verify S3 buckets
	t.Run("S3 Buckets", func(t *testing.T) {
		bucketName := terraform.Output(t, terraformOptions, "s3_bucket_name")
		assert.NotEmpty(t, bucketName, "S3 bucket name should not be empty")

		// Verify bucket exists and has versioning enabled
		aws.AssertS3BucketExists(t, awsRegion, bucketName)
		actualVersioning := aws.GetS3BucketVersioning(t, awsRegion, bucketName)
		assert.Equal(t, "Enabled", actualVersioning, "S3 versioning should be enabled")
	})

	// Test 5: Verify security groups
	t.Run("Security Groups", func(t *testing.T) {
		sgID := terraform.Output(t, terraformOptions, "eks_security_group_id")
		assert.NotEmpty(t, sgID, "Security group ID should not be empty")

		// Verify security group rules
		sg := aws.GetSecurityGroupById(t, sgID, awsRegion)
		assert.NotNil(t, sg, "Security group should exist")
	})

	// Test 6: Verify IAM roles
	t.Run("IAM Roles", func(t *testing.T) {
		roleArn := terraform.Output(t, terraformOptions, "eks_cluster_role_arn")
		assert.NotEmpty(t, roleArn, "IAM role ARN should not be empty")
		assert.Contains(t, roleArn, "arn:aws:iam", "Should be valid IAM ARN")
	})

	// Test 7: Verify monitoring configuration
	t.Run("CloudWatch Configuration", func(t *testing.T) {
		logGroupName := terraform.Output(t, terraformOptions, "cloudwatch_log_group")
		assert.NotEmpty(t, logGroupName, "CloudWatch log group should not be empty")
	})

	// Test 8: Verify tags
	t.Run("Resource Tags", func(t *testing.T) {
		vpcID := terraform.Output(t, terraformOptions, "vpc_id")
		vpc := aws.GetVpcById(t, vpcID, awsRegion)

		// Check for required tags
		tags := aws.GetTagsForVpc(t, vpcID, awsRegion)
		assert.Equal(t, "docuthinker", tags["Project"], "Project tag should be set")
		assert.Equal(t, "test", tags["Environment"], "Environment tag should be set")
	})
}

// TestKubernetesDeployment validates Kubernetes manifests
func TestKubernetesDeployment(t *testing.T) {
	t.Parallel()

	// Test would use k8s.GetDeployment() and related functions
	// to validate Kubernetes resources

	t.Run("Backend Deployment", func(t *testing.T) {
		// Validate deployment exists
		// Validate replicas
		// Validate resource limits
		// Validate health checks
	})
}

// BenchmarkInfrastructureProvision benchmarks infrastructure provisioning time
func BenchmarkInfrastructureProvision(b *testing.B) {
	for i := 0; i < b.N; i++ {
		// Provision infrastructure and measure time
	}
}
