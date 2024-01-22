import * as aws from "@pulumi/aws";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

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

const hostedZone = new aws.route53.Zone("dns-hosted-zone", {
  name: pulumiConfigs.dns.baseDomainName,
  delegationSetId: delegationSet.id,
});

const containerPlatform = createKubernetesContainerPlatform({
  infrastructure: {
    props: pulumiConfigs,
    awsHostedZoneId: hostedZone.zoneId,
  },
});

// Demo Application Stuff

const appName = "helloworld";

// Define the Nginx helloworld deployment via k8s manifest
const appLabels = { app: appName };
const deployment = new k8s.apps.v1.Deployment(appName, {
  spec: {
    selector: { matchLabels: appLabels },
    replicas: 1,
    template: {
      metadata: { labels: appLabels },
      spec: {
        containers: [
          {
            name: appName,
            image: "nginx:stable",
            ports: [{ containerPort: 80 }],
          },
        ],
      },
    },
  },
});

// Define the Nginx service
const service = new k8s.core.v1.Service(appName, {
  spec: {
    type: "LoadBalancer",
    ports: [{ port: 80 }],
    selector: appLabels,
  },
});

// Export the service's IP address
export const ipAddress = service.status.loadBalancer.ingress[0].ip;
