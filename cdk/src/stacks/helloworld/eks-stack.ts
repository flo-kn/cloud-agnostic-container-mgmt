import { HelloWorldBaseStack } from '@HelloWorld/aws-cdk-core';
import { InstanceType } from '@aws-cdk/aws-ec2';
import { Cluster, EndpointAccess, KubernetesVersion } from '@aws-cdk/aws-eks';
import { AccountRootPrincipal, PolicyStatement, Role } from '@aws-cdk/aws-iam';
import { App, Size, Tags } from '@aws-cdk/core';
import { IEKSHelloWorldEnvironmentContext } from '../../shared/eks-helloWorld-environment-context';
import { helloWorldConstructId } from '../../shared/helloWorld-construct-id';
import { VpcProps } from '../../shared/vpc-props';

export class EKSClusterStack extends HelloWorldBaseStack<IEKSHelloWorldEnvironmentContext> {
  public readonly cluster: Cluster;
  public readonly eksWorkerNodeRoleArn: string;

  private readonly clusterAdmin = new Role(this, helloWorldConstructId('AdminRole'), {
    assumedBy: new AccountRootPrincipal(),
  });
  private instanceType: string = this.context.environment.instance_type;
  private readonly clusterName: string;
  private readonly defaultAccount: string;
  private readonly defaultRegion: string;

  constructor(scope: App, id: string, props: VpcProps) {
    super(scope, id, props);

    this.defaultAccount = props.env?.account!;
    this.defaultRegion = props.env?.region!;

    this.cluster = new Cluster(this, helloWorldConstructId('Cluster'), {
      clusterName: helloWorldConstructId(''),
      mastersRole: this.clusterAdmin,
      vpc: props.vpc,
      endpointAccess: EndpointAccess.PUBLIC_AND_PRIVATE,
      vpcSubnets: [
        { subnetGroupName: helloWorldConstructId('EksPrivateSubnet') }, // pick the small /26 subnets
      ],
      version: KubernetesVersion.V1_20,
      defaultCapacity: 0, // will be handled by custom auto-scaling group
      kubectlMemory: Size.gibibytes(4),
    });
    this.clusterName = this.cluster.clusterName;
    console.log('EKS Cluster Name: ' + helloWorldConstructId(''));

    // To enforce the minCapacity we keep it sync with the desired capacity
        // Details: https://github.com/aws/aws-cdk/pull/5651
    const minCapacity = this.context.environment.node_min_capacity;

    const autoScalingGroupCapacity = this.cluster.addAutoScalingGroupCapacity(
      helloWorldConstructId('AutoScalingGroupCapacity'),
      {
        instanceType: new InstanceType(this.instanceType), // TODO: find the right sizing for prod
        minCapacity: minCapacity,
        desiredCapacity: minCapacity,
        autoScalingGroupName: helloWorldConstructId('EC2autoScalingGroup'),
        maxCapacity: 5,
        vpcSubnets: { subnetGroupName: helloWorldConstructId('EksResourcesPrivateSubnet') }, // pick the larger /22 subnets
      }
    );


    /**  Allow the cluster to create DNS entries in Route53. This is needed by the snplatform Helmchart:
     * https://github.com/streamnative/charts/blob/master/docs/helloWorld/external_dns.md
     *
     * Create policy according to documentation in:
     * https://github.com/kubernetes-sigs/external-dns/blob/master/docs/tutorials/aws.md
     * */
    const ChangeDNSPolicyJson = {
      Effect: 'Allow',
      Action: ['route53:ChangeResourceRecordSets'],
      Resource: ['arn:aws:route53:::hostedzone/*'],
    };

    const ListDNSPolicyJson = {
      Effect: 'Allow',
      Action: ['route53:ListHostedZones', 'route53:ListResourceRecordSets'],
      Resource: ['*'],
    };

    autoScalingGroupCapacity.addToRolePolicy(PolicyStatement.fromJson(ChangeDNSPolicyJson));
    autoScalingGroupCapacity.addToRolePolicy(PolicyStatement.fromJson(ListDNSPolicyJson));

    this.eksWorkerNodeRoleArn = autoScalingGroupCapacity.role.roleArn;

    Tags.of(this).add('StackID', id, {
      includeResourceTypes: ['AWS::EKS::Cluster', 'AWS::EC2::Instance', 'AWS::IAM::Role'],
    });
  }
}
