
variable "aksSubnetAddressPrefix" {
  description = "Containers DNS server IP address."
  type        = string
  default     = "10.0.0.0/16"
}

variable "virtualNetworkAddressPrefix" {
  description = "Containers DNS server IP address."
  type        = string
  default     = "10.0.0.0/8"
}

variable "applicationGatewaySubnetAddressPrefix" {
  description = "Containers DNS server IP address."
  type        = string
  default     = "10.1.0.0/16"
}


variable "location" {
  description = "The Azure location where the resource group will be created"
  type        = string
}


variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
}