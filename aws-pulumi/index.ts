import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { defineAppDeploymentManifest } from "./src/application/app-deployment-manifest";
import { defineKubernetesContainerPlatform } from "./src/kubernetes-platform-infra/kubernetes-platform-infra";
import { registerAutoTags } from "./src/tags/autotag";

import { tags } from "./src/tags/tags";
import { IPulumiConfigs } from "./src/types";

const config = new pulumi.Config();

const pulumiConfigs = config.requireObject<IPulumiConfigs>("pulumi-configs");

registerAutoTags(tags);

// Infrastructure and Platform stuff:

const containerPlatform = defineKubernetesContainerPlatform({
  infrastructure: {
    props: pulumiConfigs,
  },
});

// Demo Application Stuff

const appName = "helloworld-app";

// Define the Nginx helloworld deployment via k8s manifest
const appDeploymentManifest = defineAppDeploymentManifest(
  appName,
  containerPlatform.helloworldNamespace,
  containerPlatform.eksRoleProvider,
);

export const ipAddress = appDeploymentManifest;
export const k8sClusterName = containerPlatform.cluster.eksCluster.name;
export const clusterOidcProvider =
  containerPlatform.cluster.core.oidcProvider?.url;
export const clusterOidcProviderArn =
  containerPlatform.cluster.core.oidcProvider?.arn;
