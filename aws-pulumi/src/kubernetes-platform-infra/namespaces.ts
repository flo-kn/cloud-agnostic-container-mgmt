import * as k8s from "@pulumi/kubernetes";

export const createNamespaces = (
  provider: k8s.Provider,
  namespaceName = "default-hello-world", // override default in the pulumi yaml confs param
): {
  namespace: k8s.core.v1.Namespace;
} => {
  const namespace = new k8s.core.v1.Namespace(
    namespaceName,
    { metadata: { name: namespaceName } },
    { provider },
  );

  return { namespace };
};
