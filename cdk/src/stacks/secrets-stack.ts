import { HelloWorldBaseStack } from '@HelloWorld/aws-cdk-core';
import { Secret, SecretStringValueBeta1 } from '@aws-cdk/aws-secretsmanager';
import { App, RemovalPolicy } from '@aws-cdk/core';
import { IEKSHelloWorldEnvironmentContext } from '../shared/eks-helloWorld-environment-context';
import { SecretUnsafe, SecretsProps, isSecret } from '../shared/secrets-props';
import { toCamelCase } from '../shared/to-camel-case';

export class SecretsStack extends HelloWorldBaseStack<IEKSHelloWorldEnvironmentContext> {
  constructor(scope: App, id: string, props: SecretsProps) {
    super(scope, id, props);

    isSecret(props.secrets);

    props.secrets.forEach((secret: SecretUnsafe) => {
      new Secret(this, `Secret${toCamelCase(secret.name)}`, {
        description: secret.description,
        secretName: secret.name,
        secretStringBeta1: SecretStringValueBeta1.fromUnsafePlaintext(JSON.stringify(secret.value)),
        removalPolicy: RemovalPolicy.DESTROY,
      });
    });
  }
}
