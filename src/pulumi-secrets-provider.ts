import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { Output } from "@pulumi/pulumi";

/**
 * Encryption of the Pulumi service backend via AWS KMS (instead of passphrase)
 *
 * @returns keyArn and aliasArn
 */
export const createPulumiBackendSecretsProvider = (): {
  keyArn: Output<string>;
  aliasArn: Output<string>;
} => {
  const accountId = pulumi.output(aws.getCallerIdentity({})).id;

  // Only access for admins of this according aws account
  const keyPolicy = accountId.apply((id) =>
    JSON.stringify({
      Version: "2012-10-17",
      Id: "policy",
      Statement: [
        // Configurable statement that we can use to allow access to ADFS-admin role arn
        {
          Sid: "AllowIAMUserAccessKeys",
          Effect: "Allow",
          Action: ["kms:*"],
          Principal: {
            AWS: [`arn:aws:iam::${id}:root`],
          },
          Resource: "*",
        },
      ],
    }),
  );

  // Create a new KMS key
  const key = new aws.kms.Key("stack-encryption-key", {
    deletionWindowInDays: 10,
    description: "KMS key for encrypting Pulumi secret values",
    policy: keyPolicy, // apply the policy
  });

  // Create a new alias to the key
  const alias = new aws.kms.Alias("alias/stack-encryption-key", {
    targetKeyId: key.keyId,
  });

  const keyArn = key.arn;
  const aliasArn = alias.arn;

  return {
    keyArn,
    aliasArn,
  };
};
