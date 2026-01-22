
variable "aksSubnetAddressPrefix" {
  description = "CIDR of the AKS Subnet."
  type        = string
  default     = "10.0.0.0/17"
}

variable "virtualNetworkAddressPrefix" {
  description = "CIDR of the virtual network."
  type        = string
  default     = "10.0.0.0/16"
}

variable "applicationGatewaySubnetAddressPrefix" {
  description = "CIDR of the Application Gateway Subnet."
  type        = string
  default     = "10.0.128.0/17"
}


variable "location" {
  description = "The Azure region where the resource group will be created."
  type        = string
}


variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
}

variable "tags" {
  description = "Tags to apply to the virtual network"
  type        = map(string)
  default     = {}
}