import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import { Output } from "@pulumi/pulumi";
import * as policyFile from "./policy.json";
import { IVirtualHwResourcesConfigs } from "../../../types";

export const addExternalDnsPlugin = (
  provider: k8s.Provider,
  cluster: eks.Cluster,
  externalDNSResourceConfigs: IVirtualHwResourcesConfigs = {
    limits: {
      cpu: "50m",
      memory: "50Mi",
    },
    requests: {
      memory: "50Mi",
      cpu: "10m",
    },
  },
) => {
  const namespace = "kube-system";
  const externalDNSPolicy = JSON.stringify(policyFile);

  const policy = new aws.iam.Policy("external-dns-policy", {
    policy: externalDNSPolicy,
  });

  const externalDnsRole = new aws.iam.Role("external-dns-role", {
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
  });

  const policyAttachment = new aws.iam.PolicyAttachment(
    "external-dns-attachment",
    {
      policyArn: policy.arn,
      roles: [externalDnsRole],
    },
  );

  const serviceAccount = new k8s.core.v1.ServiceAccount(
    "external-dns-service-account",
    {
      metadata: {
        name: "external-dns-service-account",
        namespace,
        annotations: {
          "eks.amazonaws.com/role-arn": externalDnsRole.arn,
        },
      },
    },
    { provider },
  );

  const externalDns = new k8s.helm.v3.Release(
    "external-dns",
    {
      chart: "external-dns",
      version: "6.31.0",
      repositoryOpts: {
        repo: "https://charts.bitnami.com/bitnami",
      },
      namespace,
      values: {
        resources: externalDNSResourceConfigs,
        serviceAccount: {
          name: "external-dns-service-account",
          create: false,
          annotations: {
            "iam.amazonaws.com/role": externalDnsRole.arn,
          },
        },
        aws: {
          zoneType: "public",
        },
        podLabels: {
          app: "external-dns",
        },
      },
    },
    { provider },
  );
};
