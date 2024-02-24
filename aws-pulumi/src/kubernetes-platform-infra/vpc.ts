import * as awsx from "@pulumi/awsx";

export const createVPC = (clusterName: string) => {
  const clusterTag = `kubernetes.io/cluster/${clusterName}`;

  const vpc = new awsx.ec2.Vpc("vpc", {
    cidrBlock: "172.18.0.0/24",
    numberOfAvailabilityZones: 2,
    enableDnsHostnames: true,
    subnetStrategy: "Auto",
    enableDnsSupport: true,
    subnetSpecs: [
      {
        type: "Private",
        name: "PrivSn-1",
        tags: {
          [clusterTag]: "owned",
          "kubernetes.io/role/internal-elb": "1",
        },
      },
      {
        type: "Public",
        name: "PubSn-1",
        tags: {
          [clusterTag]: "owned",
          "kubernetes.io/role/elb": "1",
        },
      },
    ],
    tags: {
      Name: `${clusterName}-vpc`,
    },
  });

  return vpc;
};
