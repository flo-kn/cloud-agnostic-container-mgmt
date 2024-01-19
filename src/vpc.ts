import * as awsx from "@pulumi/awsx";
import { IVPCDetails } from ".";

export const createVPC = (vpcDetailsConfig: IVPCDetails) => {
  const vpc = new awsx.ec2.Vpc("Vpc", {
    cidrBlock: "172.17.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    numberOfAvailabilityZones: 2,
    subnetSpecs: [
      {
        type: "Private",
        name: "PrivateSubnet-1",
        tags: {
          "kubernetes.io/role/internal-elb": "1",
        },
        cidrBlocks: ["172.17.0.0/22"],
      },
      {
        type: "Private",
        name: "PrivateSubnet-2",
        tags: {
          "kubernetes.io/role/internal-elb": "1",
        },
        cidrBlocks: ["172.17.4.0/22"],

      },
      {
        type: "Public",
        name: "PublicSubnet-1",
        tags: {
          "kubernetes.io/role/elb": "1",
        },
          cidrBlocks: ["172.17.8.64/26"],
      },
      {
        type: "Public",
        name: "PublicSubnet-2",
        tags: {
          "kubernetes.io/role/elb": "1",
        },
          cidrBlocks: ["172.17.8.0/26"],

      },
    ],
  });

  return vpc;
};
