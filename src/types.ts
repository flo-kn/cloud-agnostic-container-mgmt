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
export interface IDNSConfig {
  /**
   * The base domain name to be used for creating the proxy endpoint for the data-plane
   * ex. : eu-west-1-dev.gateway.api.legogroup.io
   */
  base_domain_name: string;
}

export interface IResourcesConfigs {
  awsLoadBalancerController?: IResourceConfigs;
  externalDNS?: IResourceConfigs;
}

export interface IClusterConfigs {
  instance_type: Input<InstanceType>;
  desired_capacity: number;
  min_size: number;
  max_size: number;
  kong_namespace?: string;
}

export interface IPulumiConfigs {
  pulumi_stack_name: string;
  cluster_configs: IClusterConfigs;
  dns: IDNSConfig;
  /**
   * IVPCDetails for configuring the default vpc
   */
  vpc_details: IVPCDetails;
  /**
   * Limits and requests resource configs for the following
   * Some sensible defaults are used if nothing is passed
   */
  resource_configs?: IResourcesConfigs;
}

/**
 * A pulumi aws.route53.DelegationSet and a pulumi aws.route53.Zone should be created before using
 * this construct.
 */
export interface IDNSConfig {
  /**
   * The base domain name to be used for creating the proxy endpoint for the data-plane
   * ex. : eu-west-1-dev.gateway.api.legogroup.io
   */
  base_domain_name: string;
}
/**
 * Properties necessary for the provisioning of the Helloworld on EKS infrastructure.
 */
export interface IInfrastructureDetails {
  vpc: awsx.ec2.Vpc;
  cluster: eks.Cluster;
  helloworldNamespace: Output<string>;
  eksProvider: k8s.Provider;
}

export interface IVPCDetails {
  availability_zone_1: string;
  availability_zone_2: string;
}

export interface IClusterConfigs {
  instance_type: Input<InstanceType>;
  desired_capacity: number;
  min_size: number;
  max_size: number;
  helloworld_namespace?: string;
  monitoring_namespace?: string;
}

export interface IResourcesConfigParams {
  cpu: string;
  memory: string;
}

export interface IResourceConfigs {
  limits: IResourcesConfigParams;
  requests: IResourcesConfigParams;
}

export interface IEKSConfig {
  /**
   * Configuration for the EKS cluster
   */
  clusterConfigs: IClusterConfigs;
}

/**
 * Properties necessary for the provisioning of helloworld on EKS infrastructure.
 */
export interface IHelloWorldOnEKSProps {
  infrastructure: {
    /**
     * Properties necessary for the provisioning of the Kong Control Plane on EKS infrastructure.
     */
    props: IPulumiConfigs;
    /**
     * The aws hosted zone id where the records will be created
     */
    awsHostedZoneId: Output<string>;
  };
}
