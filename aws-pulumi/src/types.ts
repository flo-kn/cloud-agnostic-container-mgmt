import { InstanceType } from "@pulumi/aws/ec2";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import { Input, Output } from "@pulumi/pulumi";

/**
 * A pulumi aws.route53.DelegationSet and a pulumi aws.route53.Zone should be created before using
 * this construct.
 */
export interface IPublicDnsConfig {
  /**
   * The base domain name to be used for creating the proxy endpoint for the data-plane. E.g. "my-cloud-agnostic-app.my-domain.com"
   */
  baseDomainName: string;
}

/**
 * Configuration for defining the EKS Cluster
 */
export interface IEksConfigs {
  /**
   * Compute instance type. In our case we use EC2.
   * Use this https://aws.amazon.com/ec2/instance-types/ to get an overview of types
   */
  instanceType: Input<InstanceType>;
  /**
   * Numbers of nodes in the k8s cluster
   */
  desiredCapacity: number;
  /**
   * Minimal amount of nodes in the k8s cluster
   */
  minSize: number;
  /**
   * Maximal amount of nodes in the k8s cluster
   */
  maxSize: number;
  /**
   * Name of the k8s namespace to be created on cluster creation
   */
  namespace?: string;
  /**
   * Name of the IAM role to be mapped
   */
  additionalRoleMappings: IAdditionalRoleMappings;
}

/**
 * IPulumiConfigs - The type for funnelling in the structure of the pulumi configs from the yaml
 */
export interface IPulumiConfigs {
  /**
   * Name of the Pulumi Stack, e.g. "qa"
   */
  pulumiStackName: string;
  /**
   * Cluster Configuration
   */
  clusterConfigs: IEksConfigs;
  /**
   *  DNS Configuration
   */
  dns: IPublicDnsConfig;
  /**
   * Limits and requests virtual hardware resource configs for the following
   * Some sensible defaults are used if nothing is passed
   */
  resourceConfigs?: IResourcesConfigs;
}

/**
 * A mapped type where for each key K is a value from the list of Plugin Names
 */
export type K8sPlugins = "awsLoadBalancerController" | "externalDNS";

export type IResourcesConfigs = {
  [K in K8sPlugins]?: IVirtualHwResourcesConfigs;
};

/**
 * A pulumi aws.route53.DelegationSet and a pulumi aws.route53.Zone should be created before using
 * this construct.
 */
export interface IPublicDnsConfig {
  /**
   * The base domain name to be used for the public services exposed by the cluster  e.g. : my-app.my-domain.com
   */
  baseDomainName: string;
}
/**
 * Properties necessary for the provisioning of the Helloworld on EKS infrastructure including, namespace, vpc, etc. .
 */
export interface IInfrastructureConfigs {
  vpc: awsx.ec2.Vpc;
  cluster: eks.Cluster;
  helloworldNamespace: k8s.core.v1.Namespace;
  eksRoleProvider: k8s.Provider;
}

/**
 * Properties necessary for mapping additional IAM roles to the cluster
 */
export interface IAdditionalRoleMappings {
  /**
   * IAM Role ARN required in order for admins to deploy and conduct changes when being logged in with their personal sso session from terminal
   */
  awsSsoAdminRoleArn: string;
}

/**
 * CPU and Memory Specification needed from the k8s cluster
 */
export interface IVirtualHwResourcesConfigs {
  limits: {
    cpu: string;
    memory: string;
  };
  requests: {
    cpu: string;
    memory: string;
  };
}

/**
 * Configs necessary for the provisioning of helloworld on EKS infrastructure.
 */
export interface IHelloWorldOnEksConfigs {
  infrastructure: {
    /**
     * Configs necessary for the provisioning of the Hello World on EKS infrastructure.
     */
    props: IPulumiConfigs;
    /**
     * The aws hosted zone id where the records will be created
     */
    awsHostedZoneId: Output<string>;
  };
}
