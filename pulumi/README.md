# cloud-agnostic-container-mgmt

A project to help you run container workloads the cloud-agnostic style. 

For demonstration, we run a single page website on an nginx web server container. We will use a platform that will allow us to run the websites's workload on any cloud provider: Kubernetes in combination with a few so called Kubernetes Plugins. This technology stack is especially advantageous when you want to keep the door open for a eventual migration to another cloud provider with a manageable amount of effort. Here is the tec stack:

TODO: Add Tec Stack here

## Getting Started

Hands on! All you need to start your cloud-agnostic journey is a standard AWS account. Please have a look into our [Getting Started guide](./getting-started.md)!

## FAQs

### How can using AWS EKS be cloud-agnostic?

t.b.a.


### What's a "Kubernetes Plugin"?

t.b.a.

### What about cloud-agnostic DNS Service?

t.b.a.

## Make it prettier

- [This youtube video for prettier config](https://www.youtube.com/watch?v=11jpa8e5jEQ)
- [Github Repo for the video](https://github.com/JoshuaKGoldberg/create-typescript-app/blob/main/.vscode/settings.json)
- [nginx from docker hub will host our demo app](https://hub.docker.com/_/nginx)


TODO
- [ ] give hello world app also DNS name
- [] add disclaimer about this cluster not being bulletproof for security


# References:
- Best Website for Plugins: https://artifacthub.io
- AWS Workshop: https://pulumi.awsworkshop.io/50_eks_platform/20_provision_cluster/20_create_cluster.html
- https://github.com/dirien/quick-bites/blob/main/pulumi-eks-vpc-cni-network-policies/index.ts