import { App } from '@aws-cdk/core';
import 'source-map-support/register';
import { helloWorldConstructId } from '../shared/helloWorld-construct-id';
import { EKSClusterStack } from '../stacks/helloworld/eks-stack';
import { HelloWorldVpcStack } from '../stacks/helloworld/eks-vpc-stack';
import { AlbControllerHelmStack } from '../stacks/helloworld/k8s-plugins/alb-controller-helm-stack';
import { ExternalDNSManifestStack } from '../stacks/helloworld/k8s-plugins/external-dns-manifest-stack';

const app = new App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

if (!env.region) {
  throw new Error('CDK_DEFAULT_REGION not defined');
}

if (!env.account) {
  throw new Error('CDK_DEFAULT_ACCOUNT not defined');
}

/* The following stacks represent the Streamnative HelloWorld Cluster Deployment */

// HelloWorld Cluster Deployment
// Network Layer:
const vpcStack = new HelloWorldVpcStack(app, helloWorldConstructId('VpcStack'), {
  env,
});

// K8s Cluster Layer:
const eksClusterStack = new EKSClusterStack(app, helloWorldConstructId('EksStack'), {
  vpc: vpcStack.vpc,
  env,
});

const clusterAndEnv = {
  cluster: eksClusterStack.cluster,
  env,
};

// K8s Plugins:
const albControllerHHelmStack = new AlbControllerHelmStack(
  app,
  helloWorldConstructId('AlbStack'),
  clusterAndEnv
);
albControllerHHelmStack.addDependency(eksClusterStack);

const externalDNSManifestStack = new ExternalDNSManifestStack(
  app,
  helloWorldConstructId('ExternalDnsManifestStack'),
  clusterAndEnv
);
externalDNSManifestStack.addDependency(eksClusterStack);
