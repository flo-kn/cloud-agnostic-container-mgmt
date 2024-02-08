import { HelloWorldBaseStack } from '@HelloWorld/aws-cdk-core';
import {
  DefaultInstanceTenancy,
  FlowLogDestination,
  FlowLogTrafficType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from '@aws-cdk/aws-ec2';
import { App, StackProps, Tags } from '@aws-cdk/core';
import { createDeploymentIdentifier } from '../../shared/create-deployment-identifier';
import { IEKSHelloWorldEnvironmentContext } from '../../shared/eks-helloWorld-environment-context';
import { helloWorldConstructId } from '../../shared/helloWorld-construct-id';

export class HelloWorldVpcStack extends HelloWorldBaseStack<IEKSHelloWorldEnvironmentContext> {
  public readonly vpc: Vpc;

  private readonly securityGroup: SecurityGroup;
  private readonly helloWorldServiceName: string = helloWorldConstructId();

  public constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);

    /**
     * Following recommendations for EKS VPC Setup:
     *
     * https://docs.aws.amazon.com/eks/latest/userguide/network_reqs.html
     */
    this.vpc = new Vpc(this, helloWorldConstructId('Vpc'), {
      flowLogs: {
        VpcFlowLogs: {
          destination: FlowLogDestination.toCloudWatchLogs(),
          trafficType: FlowLogTrafficType.ALL,
        },
      },
      cidr: '172.17.0.0/16',
      defaultInstanceTenancy: DefaultInstanceTenancy.DEFAULT,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 3, // at least two for EKS recommended
      natGateways: 1,
      // Resources such as nodes and load balancers, should be launched in separate subnets from the subnets specified during cluster creation.
      // So one private/public pair of subnets for each:
      subnetConfiguration: [
        // small subnets for the EKS components
        {
          cidrMask: 26,
          name: helloWorldConstructId('EksPrivateSubnet'),
          subnetType: SubnetType.PRIVATE_WITH_NAT,
        },
        {
          cidrMask: 26,
          name: helloWorldConstructId('EksPublicSubnet'),
          subnetType: SubnetType.PUBLIC,
        },
        // bigger subnets for the resources and workloads such as ELBs, EC2 Scaling Group
        {
          cidrMask: 22,
          name: helloWorldConstructId('EksResourcesPrivateSubnet'),
          subnetType: SubnetType.PRIVATE_WITH_NAT,
        },
        {
          cidrMask: 26,
          name: helloWorldConstructId('EksResourcesPublicSubnet'),
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    this.securityGroup = new SecurityGroup(this, helloWorldConstructId('SecurityGroup'), {
      description: `Inbound Ports and protocols for apache HelloWorld - Security Group for ${this.helloWorldServiceName} VPC`,
      allowAllOutbound: false,
      securityGroupName: helloWorldConstructId('SecurityGroup'),
      vpc: this.vpc,
    });

    this.securityGroup.addIngressRule(
      Peer.ipv4(this.vpc.vpcCidrBlock),
      Port.tcp(443),
      `${this.helloWorldServiceName} HTTPS access to HelloWorld Proxy, SN Admin Console browser, and Grafana browser`
    );

    this.securityGroup.addIngressRule(
      Peer.ipv4(this.vpc.vpcCidrBlock),
      Port.tcp(80),
      `${this.helloWorldServiceName} - needed for redirects to https 443`
    );

    this.securityGroup.addIngressRule(
      Peer.ipv4(this.vpc.vpcCidrBlock),
      Port.tcp(6651),
      `${this.helloWorldServiceName} HelloWorld Port` // HelloWorld SSL Port
    );

    Tags.of(this).add('Name', helloWorldConstructId('Vpc'));
    Tags.of(this).add('Project', `${this.helloWorldServiceName}`);

    if (createDeploymentIdentifier()) {
      Tags.of(this).add('DeploymentNamePostfix', `${this.helloWorldServiceName}`);
    }

    Tags.of(this).add('StackID', id, {
      includeResourceTypes: ['AWS::EC2::VPC'],
    });
  }
}
