import { StackProps } from '@aws-cdk/core';

type SecretValue = {
  [key: string]: string;
};

/*
 Unsafe in this context refers to the fact that you could if you wished to act
 maliciously you could edit the source code to extract the values
 
 please don't
 
 Should add that this has always been the case every place anything is read from environment
 It's just now, incredibly visible
 */
export interface SecretUnsafe {
  name: string;
  description: string;
  value: SecretValue[];
}

export interface SecretsProps extends StackProps {
  secrets: SecretUnsafe[];
}

export function isSecret(secrets: SecretUnsafe[]) {
  secrets.forEach((secret) => {
    secretGuard(secret);
  });
}

export function secretGuard(secret: SecretUnsafe) {
  if (!secret.name) {
    throw new Error('Secrets must have a name');
  }

  if (!secret.description) {
    throw new Error(`Description missing from secret '${secret.name}'`);
  }

  if (!secret.value) {
    throw new Error(`Value missing from secret '${secret.name}'`);
  }

  secret.value.forEach((secretValue) => {
    Object.keys(secretValue).forEach((key) => {
      if (!secretValue[key]) {
        throw new Error(`Value missing from secret '${secret.name}' for key '${key}'`);
      }
    });
  });
}
