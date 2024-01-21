import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { IClusterConfigs } from "../types";

export const createK8sCluster = (vpc: awsx.ec2.Vpc, props: IClusterConfigs) => {
  // Create a new IAM role on the account caller to use as a cluster admin.
  const accountId = pulumi.output(aws.getCallerIdentity({})).accountId;

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

  const clusterAdminRoleTags = { clusterAccess: "admin-user" };

  const clusterAdminRole = new aws.iam.Role("clusterAdminRole", {
    assumeRolePolicy,
    tags: clusterAdminRoleTags,
  });

  // Create the EKS cluster itself and a deployment of the Kubernetes dashboard.
  const cluster = new eks.Cluster("cluster", {
    vpcId: vpc.vpcId,
    privateSubnetIds: vpc.privateSubnetIds,
    publicSubnetIds: vpc.publicSubnetIds,
    instanceType: props.instanceType,
    desiredCapacity: props.desiredCapacity,
    minSize: props.minSize,
    maxSize: props.maxSize,
    providerCredentialOpts: {
      profileName: aws.config.profile,
    },
    roleMappings: [
      // This will map to the deployment role from github actions
      {
        groups: ["system:masters"],
        roleArn: clusterAdminRole.arn,
        username: "pulumi:admin-user",
      },
    ],
    createOidcProvider: true,
    version: "1.28",
  });

  // Create a role-based kubeconfig with the named profile and the new
  // role mapped into the cluster's RBAC.
  const roleKubeConfigOpts: eks.KubeconfigOptions = {
    profileName: aws.config.profile,
    roleArn: clusterAdminRole.arn,
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
