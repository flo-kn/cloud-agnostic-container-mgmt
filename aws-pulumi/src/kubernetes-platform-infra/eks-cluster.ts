import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

import * as pulumi from "@pulumi/pulumi";
import { IClusterConfigs } from "../types";

export const createK8sCluster = (
  vpc: awsx.ec2.Vpc,
  props: IClusterConfigs,
  name: string,
) => {
  // Create a new IAM role on the account caller to use as a cluster admin.
  const accountId = pulumi.output(aws.getCallerIdentity({})).accountId;

  const clusterAdminRoleTags = { clusterAccess: "admin-user" };

  const assumeRolePolicy = accountId.apply((id) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "",
          Effect: "Allow",
          Principal: {
            AWS: `arn:aws:iam::${id}:root`,
          },
          Action: "sts:AssumeRole",
        },
      ],
    }),
  );

  // Create an IAM role for EKS
  const eksClusterRole = new aws.iam.Role("eksClusterRole", {
    tags: clusterAdminRoleTags,
    assumeRolePolicy,
    description: "Amazon EKS - Cluster role",
  });


  // Create the EKS cluster itself and a deployment of the Kubernetes dashboard.
  const cluster = new eks.Cluster("cluster", {
    name: name,
    vpcId: vpc.vpcId,
    privateSubnetIds: vpc.privateSubnetIds,
    publicSubnetIds: vpc.publicSubnetIds,
    instanceType: props.instanceType,
    // serviceRole: eksClusterRole,
    desiredCapacity: props.desiredCapacity,
    minSize: props.minSize,
    maxSize: props.maxSize,
    providerCredentialOpts: {
      profileName: aws.config.profile,
    },
    roleMappings: [
      // // This will map to the deployment role from github actions
      {
        groups: ["system:masters"],
        roleArn: eksClusterRole.arn,
        username: "pulumi:admin-user",
      },
      // Make sure the sso admin role can also have access to the cluster for manual kubectl commands
      {
        groups: ["system:masters"],
        roleArn: props.additionalRoleMappings.awsSsoAdminRoleArn,
        username: "pulumi:admin-usr2",
      },
    ],
    createOidcProvider: true,
    version: "1.28",
  });


// Define the ClusterRole
const clusterRole = new k8s.rbac.v1.ClusterRole(
  "aws-node-policy-endpoints",
  {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "ClusterRole",
    metadata: {
      name: "aws-node-policy-endpoints",
    },
    rules: [
      {
        apiGroups: ["networking.k8s.io"],
        resources: ["policyendpoints"],
        verbs: [ "watch", "list"],
      },
      {
        apiGroups: ["networking.k8s.aws"],
        resources: ["policyendpoints"],
        verbs: ["watch", "list"],
      },
    ],
  },
  {
    provider: cluster.core.provider,
  },
);

// Define the ClusterRoleBinding
const clusterRoleBinding = new k8s.rbac.v1.ClusterRoleBinding(
  "aws-node-policy-endpoints-binding",
  {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "ClusterRoleBinding",
    metadata: {
      name: "aws-node-policy-endpoints-binding",
    },
    roleRef: {
      kind: "ClusterRole",
      name: "aws-node-policy-endpoints", // Ensure this is the correct name
      apiGroup: "rbac.authorization.k8s.io",
    },
    subjects: [
      {
        kind: "ServiceAccount",
        name: "aws-node",
        namespace: "kube-system"
      },
    ],
  },
  {
    provider: cluster.core.provider,
  },
);
  
  // Create a role-based kubeconfig with the named profile and the new role mapped into the k8s-inherent RBAC.
  const roleKubeConfigOpts: eks.KubeconfigOptions = {
    profileName: aws.config.profile,
    roleArn: eksClusterRole.arn,
  };
  const roleKubeConfig = cluster.getKubeconfig(roleKubeConfigOpts);
  const roleProvider = new k8s.Provider(
    "provider",
    {
      kubeconfig: roleKubeConfig,
    },
    { dependsOn: [cluster.provider] },
  );

  // Export the cluster's kubeconfig at the end of deployment log output
  return { cluster, roleProvider };
};
