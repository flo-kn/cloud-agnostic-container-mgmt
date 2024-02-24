import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { Output } from "@pulumi/pulumi";
import { IVirtualHwResourcesConfigs } from "../../../types";
import * as policyFile from "./aws-load-balancer-controller-policy.json";

export const addAwsLoadBalancerController = (
  // vpc: awsx.ec2.Vpc,
  vpcId: pulumi.Output<string>,
  cluster: eks.Cluster,
  provider: k8s.Provider,
  // here we provide some default resources constraints for this plugin
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

  // // Define the ClusterRole
  // const clusterRole = new k8s.rbac.v1.ClusterRole(
  //   "aws-lb-controller-policy-endpoints",
  //   {
  //     apiVersion: "rbac.authorization.k8s.io/v1",
  //     kind: "ClusterRole",
  //     metadata: {
  //       name: "aws-lb-controller-policy-endpoints",
  //     },
  //     rules: [
  //       {
  //         apiGroups: ["networking.k8s.io"],
  //         resources: ["policyendpoints"],
  //         verbs: ["watch", "list"],
  //       },
  //     ],
  //   },
  //   {
  //     provider: cluster.core.provider,
  //   },
  // );

  // // Define the ClusterRoleBinding
  // const clusterRoleBinding = new k8s.rbac.v1.ClusterRoleBinding(
  //   "aws-lb-controller-endpoints-binding",
  //   {
  //     apiVersion: "rbac.authorization.k8s.io/v1",
  //     kind: "ClusterRoleBinding",
  //     metadata: {
  //       name: "aws-lb-controller-policy-endpoints-binding",
  //     },
  //     roleRef: {
  //       kind: "ClusterRole",
  //       name: "aws-lb-controller-policy-endpoints", // Ensure this is the correct name
  //       apiGroup: "rbac.authorization.k8s.io",
  //     },
  //     subjects: [
  //       {
  //         kind: "ServiceAccount",
  //         name: "aws-lb-controller-service-account",
  //         namespace: "kube-system",
  //       },
  //     ],
  //   },
  //   {
  //     provider: cluster.core.provider,
  //   },
  // );

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
        // vpcId: vpc.vpcId,
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
