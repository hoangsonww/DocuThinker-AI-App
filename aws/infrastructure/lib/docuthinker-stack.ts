import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class DocuThinkerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "DocuThinkerVpc", { maxAzs: 2 });

    const cluster = new ecs.Cluster(this, "DocuThinkerCluster", {
      clusterName: "docuthinker-cluster",
      vpc,
    });

    const backendImage = ecs.ContainerImage.fromEcrRepository(
      ecr.Repository.fromRepositoryName(
        this,
        "BackendRepo",
        "docuthinker-backend",
      ),
      "latest",
    );

    const aiMlImage = ecs.ContainerImage.fromEcrRepository(
      ecr.Repository.fromRepositoryName(this, "AIMLRepo", "docuthinker-ai-ml"),
      "latest",
    );

    const secretsPrefix = "docuthinker";
    const secret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "DocuThinkerSecrets",
      secretsPrefix,
    );

    const backendService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "BackendService",
        {
          cluster,
          desiredCount: 2,
          cpu: 512,
          memoryLimitMiB: 1024,
          publicLoadBalancer: true,
          taskImageOptions: {
            image: backendImage,
            containerPort: 5000,
            environment: {
              NODE_ENV: "production",
            },
            secrets: {
              OPENAI_API_KEY: ecs.Secret.fromSecretsManager(secret, "openai"),
              ANTHROPIC_API_KEY: ecs.Secret.fromSecretsManager(
                secret,
                "anthropic",
              ),
              GOOGLE_API_KEY: ecs.Secret.fromSecretsManager(secret, "google"),
            },
          },
        },
      );

    const aiMlService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      "AIMLService",
      {
        cluster,
        desiredCount: 2,
        cpu: 512,
        memoryLimitMiB: 1024,
        taskImageOptions: {
          image: aiMlImage,
          containerPort: 8000,
          environment: {
            DOCUTHINKER_SYNC_GRAPH: "true",
            DOCUTHINKER_SYNC_VECTOR: "true",
          },
          secrets: {
            OPENAI_API_KEY: ecs.Secret.fromSecretsManager(secret, "openai"),
            ANTHROPIC_API_KEY: ecs.Secret.fromSecretsManager(
              secret,
              "anthropic",
            ),
            GOOGLE_API_KEY: ecs.Secret.fromSecretsManager(secret, "google"),
            DOCUTHINKER_NEO4J_URI: ecs.Secret.fromSecretsManager(
              secret,
              "neo4j",
            ),
            DOCUTHINKER_CHROMA_DIR: ecs.Secret.fromSecretsManager(
              secret,
              "chroma",
            ),
          },
        },
        listenerPort: 8080,
      },
    );

    new cdk.CfnOutput(this, "BackendURL", {
      value: backendService.loadBalancer.loadBalancerDnsName,
    });
    new cdk.CfnOutput(this, "AIMLURL", {
      value: aiMlService.loadBalancer.loadBalancerDnsName,
    });
  }
}
