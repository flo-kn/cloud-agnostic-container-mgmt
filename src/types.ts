/* eslint-disable no-mixed-spaces-and-tabs */
import * as aws from "@pulumi/aws";
import { InstanceType } from "@pulumi/aws/ec2";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import { Input, Output } from "@pulumi/pulumi";

export interface ICertificate {
  certArn: Output<string>;
  domainName: Output<string>;
  domainValidationOptions: Output<
    aws.types.output.acm.CertificateDomainValidationOption[]
  >;
  record: string;
}

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

export interface IClusterConfigs {
  instanceType: Input<InstanceType>;
  desiredCapacity: number;
  minSize: number;
  maxSize: number;
  namespace?: string;
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
  clusterConfigs: IClusterConfigs;
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
 * Properties necessary for the provisioning of the Helloworld on EKS infrastructure.
 */
export interface IInfrastructureConfigs {
  vpc: awsx.ec2.Vpc;
  cluster: eks.Cluster;
  helloworldNamespace: Output<string>;
  eksProvider: k8s.Provider;
}

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
