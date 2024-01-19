import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

/**
 * Tags to be added to every taggable AWS resources that are part of the pulumi deployment
 */
export const kongTags: Record<string, string> = {
  Deployment: "pulumi",
  PulumiConfigName: config.name,
  PulumiProject: pulumi.getProject(),
  PulumiStack: pulumi.getStack(),
  // ...add more tags here
};
