import * as k8s from "@pulumi/kubernetes";
import { Output } from "@pulumi/pulumi";

export const createNamespaces = (
  provider: k8s.Provider,
  HelloWorldNamespaceName = "helloworld",
): {
  helloWorldNamespace: Output<string>;
} => {
  // Create a Kubernetes Namespace
  const helloWorldNamespace = new k8s.core.v1.Namespace(
    HelloWorldNamespaceName,
    { metadata: { name: HelloWorldNamespaceName } },
    { provider },
  );

  return {
    helloWorldNamespace: helloWorldNamespace.metadata.name,
  };
};
