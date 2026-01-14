variable "acr_name" {
  description = "The name of the Azure Container Registry. Must be globally unique and contain only alphanumeric characters."
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9]*$", var.acr_name)) && length(var.acr_name) >= 5 && length(var.acr_name) <= 50
    error_message = "ACR name must be 5-50 characters long and contain only alphanumeric characters."
  }
}

variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
}

variable "location" {
  description = "The Azure region where the ACR will be created"
  type        = string
}

variable "acr_sku" {
  description = "The SKU tier for the container registry. Options: Basic, Standard, Premium"
  type        = string
  default     = "Basic"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "ACR SKU must be Basic, Standard, or Premium."
  }
}

variable "admin_enabled" {
  description = "Enable admin user for the container registry"
  type        = bool
  default     = false
}

variable "public_network_access_enabled" {
  description = "Whether public network access is allowed for the container registry"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to the container registry"
  type        = map(string)
  default     = {}
}
