import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new ecs.Cluster(this, "DockerPlaygroundCluster", {
      clusterName: "docker-playground-cluster",
    });

    new ecr.Repository(this, "DockerPlaygroundRepo", {
      repositoryName: "docker-playground-repo",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });
  }
}
