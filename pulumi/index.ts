import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import * as k8s from "@pulumi/kubernetes";
import { createKubernetesContainerPlatform } from "./src/kubernetes-platform-infra/kubernetes-platform-infra";
import { registerAutoTags } from "./src/tags/autotag";

import { tags } from "./src/tags/tags";
import { IPulumiConfigs } from "./src/types";

const config = new pulumi.Config();

const pulumiConfigs = config.requireObject<IPulumiConfigs>("pulumi-configs");

registerAutoTags(tags);

// Infrastructure and Platform stuff:

const delegationSet = new aws.route53.DelegationSet("dns-delegation-set", {
  referenceName: "delegation-set",
});

// Check if all config values are set
if (!pulumiConfigs.dns || !pulumiConfigs.dns.baseDomainName) {
  throw new Error(
    "Configuration error: 'dns.baseDomainName' is not defined. \nPlease make sure that you have all filled in the required values of your pulumi stack! Details under https://www.pulumi.com/docs/concepts/config/#project-and-stack-configuration-scope",
  );
}

const hostedZone = new aws.route53.Zone("dns-hosted-zone", {
  name: pulumiConfigs.dns.baseDomainName,
  delegationSetId: delegationSet.id,
});

// const containerPlatform = createKubernetesContainerPlatform({
//   infrastructure: {
//     props: pulumiConfigs,
//     awsHostedZoneId: hostedZone.zoneId,
//   },
// });



// Demo Application Stuff

// const appName = "helloworld-app";

// // Define the Nginx helloworld deployment via k8s manifest
// const appDeploymentManifest = createAppDeploymentManifest(
//   appName,
//   containerPlatform.helloworldNamespace,
//   containerPlatform.eksRoleProvider,
// );

// export const ipAddress = appDeploymentManifest;
// export const k8sClusterName = containerPlatform.cluster.eksCluster.name
// export const kubeconfig = containerPlatform.cluster.kubeconfig
// export const clusterOidcProvider = containerPlatform.cluster.core.oidcProvider?.url
// export const clusterOidcProviderArn = containerPlatform.cluster.core.oidcProvider?.arn

// export const clusterRoleName = clusterRole.metadata.name;
// export const clusterRoleBindingName = clusterRoleBinding.metadata.name;