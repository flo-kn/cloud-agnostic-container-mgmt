
variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
}

variable "dns_zone_name" {
  description = "The name of the DNS zone"
  type        = string
}

variable "tags" {
  description = "Tags to apply to the DNS zone"
  type        = map(string)
  default     = {}
}