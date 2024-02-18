variable "aksServicePrincipalAppId" {
  description = "appId of the service principal. Used by AKS to manage AKS related resources on Azure like VMs, subnets."
  type        = string
}

variable "aksServicePrincipalClientSecret" {
  description = "Password for the service principal. Used by AKS to manage Azure."
  type        = string
  sensitive   = true
}

variable "aksServicePrincipalObjectId" {
  description = "objectId of the service principal."
  type        = string
}

variable "virtualNetworkAddressPrefix" {
  description = "Containers DNS server IP address."
  type        = string
  default     = "10.0.0.0/8"
}

variable "aksSubnetAddressPrefix" {
  description = "Containers DNS server IP address."
  type        = string
  default     = "10.0.0.0/16"
}

variable "applicationGatewaySubnetAddressPrefix" {
  description = "Containers DNS server IP address."
  type        = string
  default     = "10.1.0.0/16"
}

variable "aksDnsPrefix" {
  description = "Optional DNS prefix to use with hosted Kubernetes API server FQDN."
  type        = string
  default     = "multiCloudDemo"
}

variable "aksAgentOsDiskSizeGB" {
  description = "Disk size (in GB) to provision for each of the agent pool nodes. This value ranges from 30 to 1023."
  type        = number
  default     = 40
}

variable "aksAgentCount" {
  description = "The number of agent nodes for the cluster."
  type        = number
  default     = 1
}

variable "aksAgentVMSize" {
  description = "The size of the Virtual Machine."
  type        = string
  default     = "Standard_D3_v2"
}

variable "kubernetesVersion" {
  description = "The version of Kubernetes."
  type        = string
  default     = "1.23.3"
}

variable "aksServiceCIDR" {
  description = "A CIDR notation IP range from which to assign service cluster IPs."
  type        = string
  default     = "10.2.0.0/16"
}

variable "aksDnsServiceIP" {
  description = "Containers DNS server IP address."
  type        = string
  default     = "10.2.0.10"
}

variable "aksDockerBridgeCIDR" {
  description = "A CIDR notation IP for Docker bridge."
  type        = string
  default     = "172.17.0.1/16"
}

variable "aksEnableRBAC" {
  description = "Enable RBAC on the AKS cluster."
  type        = bool
  default     = false
}

variable "applicationGatewaySku" {
  description = "The SKU of the Application Gateway. Default: WAF_v2 (Detection mode). In order to further customize WAF, use Azure portal or CLI."
  type        = string
  default     = "WAF_v2"
}


variable "workload_identity" {
  description = "workload Id of the pod responsibel for configuring the the Application Gateway"
  type        = string
  default     = "azure_ingress_workload_identity"
}
