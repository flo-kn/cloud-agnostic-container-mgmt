import * as pulumi from "@pulumi/pulumi";
import { isTaggable } from "./taggable";

/**
 * Original idea from this Pulumi Blog Post: https://www.pulumi.com/blog/automatically-enforcing-aws-resource-tagging-policies/
 * Fight the bugs: registerStackTransformation: https://github.com/pulumi/pulumi/issues/6214
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
