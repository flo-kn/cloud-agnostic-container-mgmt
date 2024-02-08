import { HelloWorldBaseStack } from '@HelloWorld/aws-cdk-core';
import { Cluster, KubernetesManifest, ServiceAccount } from '@aws-cdk/aws-eks';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { App } from '@aws-cdk/core';
import { ClusterProps } from '../../../shared/cluster-props';
import { createDeploymentIdentifier } from '../../../shared/create-deployment-identifier';
import { IEKSHelloWorldEnvironmentContext } from '../../../shared/eks-helloWorld-environment-context';
import { helloWorldConstructId } from '../../../shared/helloWorld-construct-id';

/**
 * ExternalDNSManifestStack - Class to create the stack responsible for applying the K8s external-dns manifest.
 * This is needed to provision external DNS entries (e.g. helloWorld-manager-poc.sandbox.api.HelloWorldgroup.io) in route 53 from K8s-internal Service Accounts
 *
 * Example: In the case of HelloWorld Helm Chart we use annotations section to create DNS Record for helloWorld manager as follows:
 * -------------
 * ingress:
 *   enabled: true
 *   annotations:
 *     external-dns.alpha.kubernetes.io/hostname: helloWorld-manager-poc.sandbox.api.HelloWorldgroup.io
 *     ....
 * ---------------
 *
 * Inspired from this guide from https://github.com/kubernetes-sigs/external-dns/blob/master/docs/tutorials/aws.md
 *
 */
export class ExternalDNSManifestStack extends HelloWorldBaseStack<IEKSHelloWorldEnvironmentContext> {
  // External DNS Pod runs in kube-system namespace
  private readonly externalDnsNamespace: string = 'kube-system';
  private readonly cluster: Cluster;
  private readonly route53ServiceAccount: ServiceAccount;
  private readonly route53ServiceAccountRoleArn: string;
  private readonly deploymentTemplateOwner: string = `helloWorld-${
    this.context.environment.name
  }-${createDeploymentIdentifier()}`;

  constructor(scope: App, id: string, props: ClusterProps) {
    super(scope, id, props);

    this.cluster = props.cluster;

    // Create the Service Account
    this.route53ServiceAccount = this.cluster.addServiceAccount(helloWorldConstructId('ExternalDns'), {
      name: 'external-dns',
      namespace: this.externalDnsNamespace,
    });

    // Create policy according to documentation in: https://github.com/kubernetes-sigs/external-dns/blob/master/docs/tutorials/aws.md
    const externalDNSPolicyStatementJson1 = {
      Effect: 'Allow',
      Action: ['route53:ChangeResourceRecordSets'],
      Resource: ['arn:aws:route53:::hostedzone/*'],
    };

    const externalDNSPolicyStatementJson2 = {
      Effect: 'Allow',
      Action: ['route53:ListHostedZones', 'route53:ListResourceRecordSets'],
      Resource: ['*'],
    };

    // Add the policies to the service account
    this.route53ServiceAccount.addToPrincipalPolicy(
      PolicyStatement.fromJson(externalDNSPolicyStatementJson1)
    );
    this.route53ServiceAccount.addToPrincipalPolicy(
      PolicyStatement.fromJson(externalDNSPolicyStatementJson2)
    );

    this.route53ServiceAccountRoleArn = this.route53ServiceAccount.role.roleArn;

    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'external-dns',
        namespace: 'kube-system',
      },
      spec: {
        strategy: {
          type: 'Recreate',
        },
        selector: {
          matchLabels: {
            app: 'external-dns',
          },
        },
        template: {
          metadata: {
            labels: {
              app: 'external-dns',
            },
            annotations: {
              'iam.amazonaws.com/role': this.route53ServiceAccountRoleArn,
            },
          },
          spec: {
            serviceAccountName: 'external-dns',
            containers: [
              {
                name: 'external-dns',
                image: 'k8s.gcr.io/external-dns/external-dns:v0.7.6',
                args: [
                  '--source=service',
                  '--source=ingress',
                  '--provider=aws',
                  '--aws-zone-type=public',
                  '--registry=txt',
                  `--txt-owner-id=${this.deploymentTemplateOwner}`,
                ],
              },
            ],
            securityContext: {
              fsGroup: 65534,
            },
          },
        },
      },
    };

    const serviceAccount = {
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name: 'external-dns',
        annotations: {
          'eks.amazonaws.com/role-arn': this.route53ServiceAccountRoleArn,
        },
      },
    };

    const clusterRole = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'ClusterRole',
      metadata: {
        name: 'external-dns',
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['services', 'endpoints', 'pods'],
          verbs: ['get', 'watch', 'list'],
        },
        {
          apiGroups: ['extensions', 'networking.k8s.io'],
          resources: ['ingresses'],
          verbs: ['get', 'watch', 'list'],
        },
        {
          apiGroups: [''],
          resources: ['nodes'],
          verbs: ['list', 'watch'],
        },
      ],
    };

    const clusterRoleBinding = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'ClusterRoleBinding',
      metadata: {
        name: 'external-dns-viewer',
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: 'external-dns',
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: 'external-dns',
          namespace: this.externalDnsNamespace,
        },
      ],
    };

    // Apply the Manifest
    new KubernetesManifest(this, helloWorldConstructId('ExternalDnsManifest'), {
      cluster: this.cluster,
      manifest: [deployment, serviceAccount, clusterRole, clusterRoleBinding],
    });
  }
}
