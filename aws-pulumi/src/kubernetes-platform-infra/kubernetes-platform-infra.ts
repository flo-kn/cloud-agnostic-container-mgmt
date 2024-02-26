import { IHelloWorldOnEksConfigs, IInfrastructureConfigs } from "../types";
import { createK8sCluster as defineK8sCluster } from "./eks-cluster";
import { addAwsLoadBalancerController as defineAwsLoadBalancerController } from "./kubernetes-plugins";
import { createNamespaces as defineNamespaces } from "./namespaces";
import { createVPC as defineVpc } from "./vpc";

/**
 * Function to create the virtual network (VPC), the Kubernetes Cluster (EKS) along with 2 Kubernetes Plugins (ExternalDNS and ALBController) and finally a Helloworld namespace where our Helloworld App runs in.
 * @param props - All configs required to deploy the solution, such as `baseDomain` for the public DSN, or `instanceType` for the Kubernetes Cluster instances, etc.
 * @returns vpc, cluster, cluster namespace, cluster provider
 */
export const defineKubernetesContainerPlatform = (
  props: IHelloWorldOnEksConfigs,
): IInfrastructureConfigs => {
  const { clusterConfigs, resourceConfigs } = props.infrastructure.props;

  const name = "helloworld";

  const vpc = defineVpc(name);

  const eksCluster = defineK8sCluster(vpc, clusterConfigs, name);

  const awsLbController = defineAwsLoadBalancerController(
    eksCluster.cluster.core.vpcId,
    eksCluster.cluster,
    eksCluster.roleProvider,
    resourceConfigs?.awsLoadBalancerController,
  );

  // const externalDNS = defineExternalDnsPlugin(
  //   eksCluster.roleProvider,
  //   eksCluster.cluster,
  //   resourceConfigs?.externalDNS,
  // );

  const k8sNamespaces = defineNamespaces(
    eksCluster.roleProvider,
    clusterConfigs.namespace,
  );

  return {
    vpc,
    cluster: eksCluster.cluster,
    helloworldNamespace: k8sNamespaces.namespace,
    eksRoleProvider: eksCluster.roleProvider,
  };
};
