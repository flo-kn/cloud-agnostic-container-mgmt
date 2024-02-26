import * as k8s from "@pulumi/kubernetes";
import { Output } from "@pulumi/pulumi";

export const createNamespaces = (
  provider: k8s.Provider,
  namespaceName = "default-helloWorld", // override default in the pulumi yaml confs param
): {
  namespace: Output<string>;
} => {
  const namespace = new k8s.core.v1.Namespace(
    namespaceName,
    { metadata: { name: namespaceName } },
    { provider },
  );

  return {
    namespace: namespace.metadata.name,
  };
};
