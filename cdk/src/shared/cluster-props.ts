import { StackProps } from '@aws-cdk/core';
import { Cluster } from '@aws-cdk/aws-eks';

export interface ClusterProps extends StackProps {
  cluster: Cluster;
}
