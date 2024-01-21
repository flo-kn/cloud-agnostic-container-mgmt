import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { createKubernetesContainerPlatform } from "./src/kubernetes-platform/kubernetes-platform";
import { tags } from "./src/tags/tags";
import { registerAutoTags } from "./src/tags/autotag";
import { IPulumiConfigs } from "./src/types";

const config = new pulumi.Config();

const pulumiConfigs = config.requireObject<IPulumiConfigs>("pulumi-configs");

registerAutoTags(tags);

const delegationSet = new aws.route53.DelegationSet("delegation-set", {
  referenceName: "delegation-set",
});

const hostedZone = new aws.route53.Zone("hosted-zone", {
  name: pulumiConfigs.dns.baseDomainName,
  delegationSetId: delegationSet.id,
});

const containerPlatform = createKubernetesContainerPlatform({
  infrastructure: {
    props: pulumiConfigs,
    awsHostedZoneId: hostedZone.zoneId,
  },
});
