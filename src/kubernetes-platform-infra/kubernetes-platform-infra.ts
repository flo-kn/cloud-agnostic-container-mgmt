import { IHelloWorldOnEksConfigs, IInfrastructureConfigs } from "../types";
import { createK8sCluster } from "./eks-cluster";
import { createNamespaces } from "./namespaces";
import { addAwsLoadBalancerController, addExternalDnsPlugin } from "./plugins";
import { createVPC } from "./vpc";

/**
 * Function to create the virtual network (VPC), the Kubernetes Cluster (EKS) along with 2 Kubernetes Plugins (ExternalDNS and ALBController) and finally a Helloworld namespace where our Helloworld App runs in.
 * @param props - All configs required to deploy the solution, such as `baseDomain` for the public DSN, or `instanceType` for the Kubernetes Cluster instances, etc.
 * @returns vpc, cluster, cluster namespace, cluster provider
 */
export const createKubernetesContainerPlatform = (
  props: IHelloWorldOnEksConfigs,
): IInfrastructureConfigs => {
  const { clusterConfigs, resourceConfigs } = props.infrastructure.props;

  const vpc = createVPC();

  const eksCluster = createK8sCluster(vpc, clusterConfigs);

  const awsLBController = addAwsLoadBalancerController(
    vpc,
    eksCluster.cluster,
    eksCluster.roleProvider,
    resourceConfigs?.awsLoadBalancerController,
  );

  const externalDNS = addExternalDnsPlugin(
    eksCluster.roleProvider,
    eksCluster.cluster,
    resourceConfigs?.externalDNS,
  );

  const k8sNamespaces = createNamespaces(
    eksCluster.roleProvider,
    clusterConfigs.namespace,
  );

  return {
    vpc,
    cluster: eksCluster.cluster,
    helloworldNamespace: k8sNamespaces.namespace,
    eksProvider: eksCluster.roleProvider,
  };
};