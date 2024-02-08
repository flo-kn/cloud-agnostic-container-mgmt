import { ClusterProps } from './cluster-props';

export interface HelmProps extends ClusterProps {
  workerRoleArn: string;
}
