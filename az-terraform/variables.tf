variable "location" {
  description = "The azure region. Pick yours from the list: https://azure.microsoft.com/en-us/explore/global-infrastructure/geographies/#choose-your-region"
  type        = string
} 
variable "aksServicePrincipalAppId" {
  description = "appId of the service principal. Used by AKS to manage AKS related resources on Azure like VMs, subnets."
  type        = string
}

variable "environmentPrefix" {
  type = string
  description = "A prefix used for naming resources to ensure uniqueness"
  default = "dev" # Default value; can be overridden
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
  description = "The size of the virtual machine(s)."
  type        = string
  default     = "Standard_D3_v2"
}

variable "kubernetesVersion" {
  description = "The version of Kubernetes."
  type        = string
  default     = "1.27.7"
}

variable "aksServiceCIDR" {
  description = "A CIDR notation IP range from which to assign service cluster IPs. Make sure to not overlap"
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

variable "waf_enabled" {
  description = "Option to enable a WAF (Web Application Firewall) in front of the Application Gateway"
  type        = bool
  default     = false
}

variable "workload_identity" {
  description = "Workload Id of the pod responsibel for configuring the the Application Gateway"
  type        = string
  default     = "azure_ingress_workload_identity"
}
