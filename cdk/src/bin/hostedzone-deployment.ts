#!/usr/bin/env node
import { App } from '@aws-cdk/core';
import 'source-map-support/register';
import { HelloWorldHostedzoneStack } from '../stacks/helloworld/dns/hostedzone-stack';

/**
 * Decision to take Hosted Zone has its own app/deployment for the following two reasons:
 *
 * - required from both ControlPanel and HelloWorld Cluster independently
 * - not expected to change or vary after initial deployment
 */

const app = new App();

/**
 * Stack for the async-api-management environment domain hosting records under *.<environment>.async.api.HelloWorldgroup.io
 *
 * more detail in https://github.com/HelloWorld/api-management-dns
 */
const helloWorldHostedZoneStack = new HelloWorldHostedzoneStack(app, 'HelloWorldHostedZone', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
