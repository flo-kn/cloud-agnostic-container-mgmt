import * as awsx from "@pulumi/awsx";

export const createVPC = () => {
  const vpc = new awsx.ec2.Vpc("Vpc", {
    cidrBlock: "172.18.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true, 
    numberOfAvailabilityZones: 2,
    subnetSpecs: [
      {
        type: "Private",
        name: "PrivSn-1",
        tags: {
          "kubernetes.io/role/internal-elb": "1",
        },
        cidrBlocks: ["172.18.0.0/22"],
      },
      {
        type: "Private",
        name: "PrivSn-2",
        tags: {
          "kubernetes.io/role/internal-elb": "1",
        },
        cidrBlocks: ["172.18.4.0/22"],
      },
      {
        type: "Public",
        name: "PubSn-1",
        tags: {
          "kubernetes.io/role/elb": "1",
        },
        cidrBlocks: ["172.18.8.64/26"],
      },
      {
        type: "Public",
        name: "PubSn-2",
        tags: {
          "kubernetes.io/role/elb": "1",
        },
        cidrBlocks: ["172.18.8.0/26"],
      },
    ],
  });

  return vpc;
};
