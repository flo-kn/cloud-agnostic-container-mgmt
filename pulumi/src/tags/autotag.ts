import * as pulumi from "@pulumi/pulumi";
import { isTaggable } from "./taggable";

/**
 * Here we ensure tagging for cloud resources.
 * Registers a global stack transformation that merges a set of tags with whatever was also explicitly added to the resource definition.
 *
 * Troubleshooting: registerStackTransformation: https://github.com/pulumi/pulumi/issues/6214
 * Original idea from this Pulumi Blog Post: https://www.pulumi.com/blog/automatically-enforcing-aws-resource-tagging-policies/
 *
 */
export const registerAutoTags = (autoTags: Record<string, string>): void => {
  pulumi.runtime.registerStackTransformation((args) => {
    if (isTaggable(args.type)) {
      args.props.tags = { ...args.props.tags, ...autoTags };
      return { props: args.props, opts: args.opts };
    }
    return undefined;
  });
};
