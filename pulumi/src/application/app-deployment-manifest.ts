import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

/**
 * App container instance
 *
 * @param namespace - The k8s namespace
 */
export const createAppDeploymentManifest = async (
  appName: string,
  namespace: k8s.core.v1.Namespace,
  provider: k8s.Provider,
) => {
  const config = new pulumi.Config();

  const appLabels = { app: appName };

  const ns = namespace.metadata.name;

  const deployment = new k8s.apps.v1.Deployment(
    appName,
    {
      kind: "Deployment",
      metadata: {
        name: appName,
        labels: appLabels,
        namespace: ns,
      },
      spec: {
        selector: { matchLabels: appLabels },
        replicas: 1,
        template: {
          metadata: { name: appName, labels: appLabels, namespace: ns },
          spec: {
            containers: [
              {
                name: appName,
                image: "nginx:stable",
                ports: [{ containerPort: 80 }],
              },
            ],
          },
        },
      },
    },
    {
      provider,
      dependsOn: provider,
    },
  );

  // Define the Nginx service
  const service = new k8s.core.v1.Service(
    appName,
    {
      kind: "Service",
      metadata: {
        name: appName,
        labels: appLabels,
        namespace: ns,
      },
      spec: {
        type: "NodePort",
        ports: [{ port: 80 }],
        selector: appLabels,
      },
    },
    {
      provider,
      dependsOn: provider,
    },
  );

  // Define the Nginx service, TODO: make name to  service.metadata.name,
  const ingress = new k8s.networking.v1.Ingress(
    appName,
    {
      kind: "Ingress",
      metadata: {
        name: appName,
        labels: appLabels,
        namespace: ns,
        annotations: {
          "kubernetes.io/ingress.class": "alb",
          "alb.ingress.kubernetes.io/scheme": "internet-facing",
          "alb.ingress.kubernetes.io/target-type": "ip",
          "alb.ingress.kubernetes.io/listen-ports": '[{"HTTP": 80}]',
        },
      },
      spec: {
        rules: [
          {
            http: {
              paths: [
                {
                  path: "/*",
                  pathType: "Prefix",
                  backend: {
                    service: {
                      name: appName,
                      port: {
                        number: 80,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      provider,
      dependsOn: provider,
    },
  );

  // the service's IP address
  return service.status.loadBalancer.ingress[0].ip;
};
