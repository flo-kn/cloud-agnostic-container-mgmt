import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { Output } from "@pulumi/pulumi";
import { IVirtualHwResourcesConfigs } from "../../../types";
import * as policyFile from "./aws-load-balancer-controller-policy.json";

export const addAwsLoadBalancerController = (
  vpcId: pulumi.Output<string>,
  cluster: eks.Cluster,
  provider: k8s.Provider,
  awsLoadBalancerControllerResourceConfigs: IVirtualHwResourcesConfigs = {
    limits: {
      cpu: "100m",
      memory: "128Mi",
    },
    requests: {
      cpu: "100m",
      memory: "128Mi",
    },
  },
) => {
  const loadBalancerControllerPolicy = JSON.stringify(policyFile);
  const region = pulumi.output(aws.getRegion());

  const policy = new aws.iam.Policy("aws-loadbalancer-controller-policy", {
    policy: loadBalancerControllerPolicy,
  });

  const loadBalancerRole = new aws.iam.Role(
    "aws-loadbalancer-controller-role",
    {
      assumeRolePolicy: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRoleWithWebIdentity",
            Effect: "Allow",
            Principal: {
              Federated: cluster.core.oidcProvider?.arn as Output<string>,
            },
          },
        ],
      },
    },
  );

  const policyAttachment = new aws.iam.PolicyAttachment(
    "aws-load-balancer-controller-attachment",
    {
      policyArn: policy.arn,
      roles: [loadBalancerRole],
    },
  );

  const elbTaggingPolicy = new aws.iam.Policy("elbTaggingPolicy", {
    description: "Policy to allow ELB tagging by the Load Balancer Controller",
    policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "elasticloadbalancing:AddTags",
          Resource: "*",
          Effect: "Allow",
        },
      ],
    }),
  });
  
  const policyAttachment2 = new aws.iam.PolicyAttachment(
    "aws-load-balancer-controller-attachment-2",
    {
      policyArn: elbTaggingPolicy.arn,
      roles: [loadBalancerRole],
    },
  );

  const serviceAccount = new k8s.core.v1.ServiceAccount(
    "aws-lb-controller-service-account",
    {
      metadata: {
        name: "aws-lb-controller-service-account",
        namespace: "kube-system",
        annotations: {
          "eks.amazonaws.com/role-arn": loadBalancerRole.arn,
        },
      },
    },
    { provider },
  );

  const awsLoadBalancerControllerHelm = new k8s.helm.v3.Release(
    "lb",
    {
      chart: "aws-load-balancer-controller",
      version: "1.6.2",
      repositoryOpts: {
        repo: "https://aws.github.io/eks-charts",
      },
      namespace: "kube-system",
      values: {
        region: region.name,
        serviceAccount: {
          name: "aws-lb-controller-service-account",
          create: false,
        },
        vpcId: vpcId,
        clusterName: cluster.core.cluster.name,
        podLabels: {
          app: "aws-lb-controller",
        },
        hostNetwork: true,
        resources: awsLoadBalancerControllerResourceConfigs,
      },
    },
    { provider },
  );
};
