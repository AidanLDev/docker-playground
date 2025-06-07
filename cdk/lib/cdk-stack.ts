import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "Vpc", { isDefault: true });

    const cluster = new ecs.Cluster(this, "DockerPlaygroundCluster", {
      clusterName: "docker-playground-cluster",
      vpc,
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

    const logGroup = new logs.LogGroup(this, "DockerPlaygroundLogs", {
      logGroupName: "/ecs/docker-playground",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add container to task definition
    taskDef.addContainer("DockerPlaygroundContainer", {
      image: ecs.ContainerImage.fromEcrRepository(repo),
      portMappings: [{ containerPort: 3000 }],
      essential: true,
      environment: {
        HOSTNAME: "0.0.0.0",
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "ecs",
        logGroup: logGroup,
      }),
    });

    // Create a security group that allows inbound traffic
    const sg = new ec2.SecurityGroup(this, "DockerPlaygroundSG", {
      vpc,
      description: "Allow HTTP traffic on port 3000",
      allowAllOutbound: true,
    });

    // Allow inbound traffic on port 3000
    sg.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3000),
      "Allow outbound HTTP traffic on port 3000"
    );

    sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3000),
      "Allow inbound HTTP traffic on port 3000"
    );

    // Create Fargate Service
    new ecs.FargateService(this, "DockerPlaygroundService", {
      cluster: cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: true,
      securityGroups: [sg],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });
  }
}
