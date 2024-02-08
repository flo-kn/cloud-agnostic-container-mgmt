import { HelloWorldBaseStack } from '@HelloWorld/aws-cdk-core';
import { Cluster } from '@aws-cdk/aws-eks';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { App, Duration } from '@aws-cdk/core';
import { ClusterProps } from '../../../shared/cluster-props';
import { IEKSHelloWorldEnvironmentContext } from '../../../shared/eks-helloWorld-environment-context';

const request = require('sync-request');

/**
 * AlbControllerHelmStack - Class to create the ALB HELM Stack needed to create ALB Ingress inside K8s
 *
 * Allows us to create an ALB Ingress for inside our HelloWorld Helm Chart as for example:
 * ----------
 *  ingress:
 *   enabled: true
 *   annotations:
 *     kubernetes.io/ingress.class: alb
 *     alb.ingress.kubernetes.io/scheme: internet-facing
 *     alb.ingress.kubernetes.io/target-type: ip
 * ...
 * ____________
 */
export class AlbControllerHelmStack extends HelloWorldBaseStack<IEKSHelloWorldEnvironmentContext> {
  private readonly cluster: Cluster;
  private readonly albNamespace: string = 'kube-system';
  private readonly targetRegion: string = process.env.CDK_DEFAULT_REGION!;
  private readonly awsLoadBalancerControllerVersion: string = 'v2.2.0';
  private readonly awsControllerBaseResourceBaseUrl: string = `https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/${this.awsLoadBalancerControllerVersion}/docs`;
  private readonly awsControllerPolicyUrl: string = `${
    this.awsControllerBaseResourceBaseUrl
  }/install/iam_policy${this.targetRegion.startsWith('cn-') ? '_cn' : ''}.json`;
  private readonly helmRepositoryArn: string =
    '602401143452.dkr.ecr.eu-west-1.amazonaws.com/amazon/aws-load-balancer-controller';

  constructor(scope: App, id: string, props: ClusterProps) {
    super(scope, id, props);

    this.cluster = props.cluster;

    /**
     * Install AWS Load Balancer Controller via Helm charts and the alb Service Account
     * Code Snipped taken from  https://github.com/aws-samples/nexus-oss-on-aws/blob/d3a092d72041b65ca1c09d174818b513594d3e11/src/lib/sonatype-nexus3-stack.ts#L207-L242
     **/

    const albServiceAccount = this.cluster.addServiceAccount('aws-load-balancer-controller', {
      name: 'aws-load-balancer-controller',
      namespace: this.albNamespace,
    });

    const policyJson = request('GET', this.awsControllerPolicyUrl).getBody();
    (JSON.parse(policyJson).Statement as []).forEach((statement, _idx, _array) => {
      albServiceAccount.addToPrincipalPolicy(PolicyStatement.fromJson(statement));
    });

    // AWS ALB Controller will be installed in the kube-system namespace by the Remote Helm Chart
    // TODO: Consider not using the remote HELM Chart and make it local instead
    this.cluster.addHelmChart('AWSLoadBalancerController', {
      chart: 'aws-load-balancer-controller',
      repository: 'https://aws.github.io/eks-charts',
      namespace: this.albNamespace,
      release: 'aws-load-balancer-controller',
      version: '1.2.0', // mapping to v2.2.0
      wait: true,
      timeout: Duration.minutes(15),
      values: {
        clusterName: this.cluster.clusterName,
        image: {
          // Pick the image in the right region
          // https://docs.aws.amazon.com/eks/latest/userguide/add-ons-images.html
          repository: this.helmRepositoryArn,
        },
        serviceAccount: {
          create: false,
          name: albServiceAccount.serviceAccountName,
        },
        // Hint: for aws-cn partition waf features must be disabled
        enableShield: false,
        enableWaf: false,
        enableWafv2: false,
      },
    });
  }
}
