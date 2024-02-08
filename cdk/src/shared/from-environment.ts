import { environmentError } from './environment-error';

export function getServiceAccountUsername(): string {
  if (!process.env.SECRETS_SERVICE_ACCOUNT_USERNAME) {
    throw new Error(environmentError('Service Account Username'));
  }

  return process.env.SECRETS_SERVICE_ACCOUNT_USERNAME;
}

export function getServiceAccountPassword(): string {
  if (!process.env.SECRETS_SERVICE_ACCOUNT_PASSWORD) {
    throw new Error(environmentError('Service Account Password'));
  }

  return process.env.SECRETS_SERVICE_ACCOUNT_PASSWORD;
}

export function getHelloWorldClientAccountId(): string {
  if (!process.env.HELLOWORLDCLIENT__CLIENTID) {
    throw new Error(environmentError('HelloWorld Client Id'));
  }

  return process.env.HELLOWORLDCLIENT__CLIENTID;
}

export function getHelloWorldClientAccountSecret(): string {
  if (!process.env.HELLOWORLDCLIENT__CLIENTSECRET) {
    throw new Error(environmentError('HelloWorld Client Secret'));
  }

  return process.env.HELLOWORLDCLIENT__CLIENTSECRET;
}

export function getCdkDefaultRegion(): string {
  if (!process.env.CDK_DEFAULT_REGION) {
    throw new Error('CDK_DEFAULT_REGION not defined');
  }

  return process.env.CDK_DEFAULT_REGION;
}

export function getCdkDefaultAccount(): string {
  if (!process.env.CDK_DEFAULT_ACCOUNT) {
    throw new Error('CDK_DEFAULT_ACCOUNT not defined');
  }

  return process.env.CDK_DEFAULT_ACCOUNT;
}

export function getServiceAccountName(): string {
  return 'Service_Account_For_Owning_AAD_Applications';
}

export function getHelloWorldClientName(): string {
  return 'HELLOWORLDCLIENT';
}
