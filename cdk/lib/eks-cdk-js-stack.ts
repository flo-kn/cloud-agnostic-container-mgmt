import * as cdk from "aws-cdk-lib";
import { CfnJson } from "aws-cdk-lib";
import { IVpc, Vpc } from "aws-cdk-lib/aws-ec2";
import {
  AwsAuth,
  CfnAddon,
  Cluster,
  EndpointAccess,
  KubernetesManifest,
  KubernetesVersion,
} from "aws-cdk-lib/aws-eks";
import {
  AccountRootPrincipal,
  ManagedPolicy,
  OpenIdConnectPrincipal,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Key } from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";
import * as fs from "fs";
import * as yaml from "js-yaml";

import { addEndpoint, eksVpc } from "../lib/vpc-stack";

interface ekstackprops extends cdk.StackProps {}

export class Ekstack extends cdk.Stack {
  public readonly cluster: Cluster;
  public readonly awsauth: AwsAuth;

  constructor(scope: Construct, id: string, props: ekstackprops) {
    super(scope, id, props);
    // Clusters can only be upgraded and cannot be downgraded. Nodegroups are updated separately, refer to nodeAMIVersion parameter in README.md
    // https://docs.aws.amazon.com/eks/latest/userguide/update-cluster.html

    const clusterAdmin = new Role(this, "AdminRole", {
      assumedBy: new AccountRootPrincipal(),
    });

    const vpc = this.getOrCreateVpc(this);

    // Need KMS Key for EKS Envelope Encryption, if deleted, KMS will wait default (30 days) time before removal.
    const clusterKmsKey = new Key(this, "ekskmskey", {
      enableKeyRotation: true,
      alias: cdk.Fn.join("", ["alias/", "eks/", this.getOrCreateEksName(this)]),
    });
    this.cluster = new Cluster(this, "EKSCluster", {
      version: KubernetesVersion.V1_28,
      defaultCapacity: 0,
      // https://aws.github.io/aws-eks-best-practices/security/docs/iam/#make-the-eks-cluster-endpoint-private
      endpointAccess: EndpointAccess.PUBLIC_AND_PRIVATE,
      vpc: vpc,
      secretsEncryptionKey: clusterKmsKey,
      mastersRole: clusterAdmin,
      // mastersRole: bastionHostLinux.role,
      clusterName: this.getOrCreateEksName(this),
      // Ensure EKS helper lambadas are in private subnets
      placeClusterHandlerInVpc: true,
    });

    this.awsauth = new AwsAuth(this, "EKS_AWSAUTH", {
      cluster: this.cluster,
    });

    // deploy Custom k8s RBAC group to provide EKS Web Console read only permissions https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html
    // https://aws.github.io/aws-eks-best-practices/security/docs/iam.html#employ-least-privileged-access-when-creating-rolebindings-and-clusterrolebindings
    const manifestConsoleViewGroup = yaml.loadAll(
      fs.readFileSync("manifests/consoleViewOnlyGroup.yaml", "utf-8")
    ) as Record<string, any>[];
    const manifestConsoleViewGroupDeploy = new KubernetesManifest(
      this,
      "eks-group-view-only",
      {
        manifest: manifestConsoleViewGroup,
        cluster: this.cluster,
      }
    );

    this.awsauth.node.addDependency(manifestConsoleViewGroupDeploy);
    this.awsauth.addMastersRole(
      clusterAdmin,
      `${clusterAdmin.roleArn}/{{SessionName}}`
    );
    // Patch aws-node daemonset to use IRSA via EKS Addons, do before nodes are created
    // https://aws.github.io/aws-eks-best-practices/security/docs/iam/#update-the-aws-node-daemonset-to-use-irsa
    const awsNodeconditionsPolicy = new CfnJson(
      this,
      "awsVpcCniconditionPolicy",
      {
        value: {
          [`${this.cluster.openIdConnectProvider.openIdConnectProviderIssuer}:aud`]:
            "sts.amazonaws.com",
          [`${this.cluster.openIdConnectProvider.openIdConnectProviderIssuer}:sub`]:
            "system:serviceaccount:kube-system:aws-node",
        },
      }
    );
    const awsNodePrincipal = new OpenIdConnectPrincipal(
      this.cluster.openIdConnectProvider
    ).withConditions({
      StringEquals: awsNodeconditionsPolicy,
    });
    const awsVpcCniRole = new Role(this, "awsVpcCniRole", {
      assumedBy: awsNodePrincipal,
    });

    awsVpcCniRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonEKS_CNI_Policy")
    );
    (() =>
      new CfnAddon(this, "vpc-cni", {
        addonName: "vpc-cni",
        resolveConflicts: "OVERWRITE",
        serviceAccountRoleArn: awsVpcCniRole.roleArn,
        clusterName: this.cluster.clusterName,
        addonVersion: this.node.tryGetContext("eks-addon-vpc-cni-version"),
      }))();

    (() =>
      new CfnAddon(this, "kube-proxy", {
        addonName: "kube-proxy",
        resolveConflicts: "OVERWRITE",
        clusterName: this.cluster.clusterName,
        addonVersion: this.node.tryGetContext("eks-addon-kube-proxy-version"),
      }))();
    (() =>
      new CfnAddon(this, "core-dns", {
        addonName: "coredns",
        resolveConflicts: "OVERWRITE",
        clusterName: this.cluster.clusterName,
        addonVersion: this.node.tryGetContext("eks-addon-coredns-version"),
      }))();

    // Add existing IAM Role to Custom Group
    // https://aws.github.io/aws-eks-best-practices/security/docs/iam/#use-iam-roles-when-multiple-users-need-identical-access-to-the-cluster
    // this.awsauth.addRoleMapping(Role.fromRoleArn(this, 'Role_Admin', `arn:aws:iam::${this.account}:role/Admin`), {
    //   groups: ['eks-console-dashboard-full-access-group'],
    //   username: `arn:aws:iam::${this.account}:role/Admin/{{SessionName}}`,
    // });
  }

  // Create nodegroup IAM role in same stack as eks cluster to ensure there is not a circular dependency
  public createNodegroupRole(id: string): Role {
    const role = new Role(this, id, {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
    });
    role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSWorkerNodePolicy")
    );
    role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonEC2ContainerRegistryReadOnly"
      )
    );
    this.awsauth.addRoleMapping(role, {
      username: "system:node:{{EC2PrivateDNSName}}",
      groups: ["system:bootstrappers", "system:nodes"],
    });
    return role;
  }

  private getOrCreateVpc(scope: Construct): IVpc {
    // use an existing vpc or create a new one using cdk context
    const stack = cdk.Stack.of(scope);
    // Able to choose default vpc but will error if EKS Cluster endpointAccess is set to be Private, need private subnets
    if (stack.node.tryGetContext("use_default_vpc") === "1") {
      return Vpc.fromLookup(stack, "EKSNetworking", { isDefault: true });
    }
    if (stack.node.tryGetContext("use_vpc_id") !== undefined) {
      return Vpc.fromLookup(stack, "EKSNetworking", {
        vpcId: stack.node.tryGetContext("use_vpc_id"),
      });
    }
    const vpc = new Vpc(stack, stack.stackName + "-EKSNetworking", eksVpc);
    addEndpoint(stack, vpc);
    return vpc;
  }

  private getOrCreateEksName(scope: Construct): string {
    // use an existing vpc or create a new one using cdk context
    const stack = cdk.Stack.of(scope);
    if (stack.node.tryGetContext("cluster_name") !== undefined) {
      return stack.node.tryGetContext("cluster_name");
    }
    return "myekscluster";
  }
}
