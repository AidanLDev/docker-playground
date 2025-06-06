import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, "DockerPlaygroundCluster", {
      clusterName: "docker-playground-cluster",
    });

    const repo = new ecr.Repository(this, "DockerPlaygroundRepo", {
      repositoryName: "docker-playground-repo",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    const taskDef = new ecs.FargateTaskDefinition(
      this,
      "DockerPlaygroundTaskDef",
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    // Add container to task definition
    taskDef.addContainer("DockerPlaygroundContainer", {
      image: ecs.ContainerImage.fromEcrRepository(repo),
      portMappings: [{ containerPort: 3000 }],
      essential: true,
    });

    // Create Fargate Service
    new ecs.FargateService(this, "DockerPlaygroundService", {
      cluster: cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: true,
    });
  }
}
