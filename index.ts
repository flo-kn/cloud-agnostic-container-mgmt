/* eslint-disable no-console */
import {
  IHelloWorldOnEKSProps,
  IInfrastructureDetails,
  createAWSLoadBalancerController,
  createExternalDNSPlugin,
  createK8sCluster,
  createNamespaces,
  createVPC,
} from './src';

export * from './src';

export const createInfrastructure = (
  props: IHelloWorldOnEKSProps
  ): IInfrastructureDetails => {
    const {
      cluster_configs,
      vpc_details,
      resource_configs,
    } = props.infrastructure.props;

  const vpc = createVPC(vpc_details);

  const eksCluster = createK8sCluster(vpc, {
    clusterConfigs: cluster_configs,
  });

  const awsLBController = createAWSLoadBalancerController(
    vpc,
    eksCluster.cluster,
    eksCluster.roleProvider,
    resource_configs?.awsLoadBalancerController
  );

  const externalDNS = createExternalDNSPlugin(
    eksCluster.roleProvider,
    eksCluster.cluster,
    resource_configs?.externalDNS
  );

  const k8sNamespaces = createNamespaces(
    eksCluster.roleProvider,
    cluster_configs.helloworld_namespace,
  );

  return {
    vpc,
    cluster: eksCluster.cluster,
    helloworldNamespace: k8sNamespaces.helloWorldNamespace,
    eksProvider: eksCluster.roleProvider,
  };


};
