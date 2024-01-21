import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

/**
 * Tags to be added to every taggable AWS resources that are part of the pulumi deployment
 */
export const tags: Record<string, string> = {
  /**
   * Tag the resource with the name of the deployment tool that provisioned the resource 
   */
  DeploymentTool: "pulumi",
  PulumiConfigName: config.name,
  PulumiProject: pulumi.getProject(),
  PulumiStack: pulumi.getStack(),
};
