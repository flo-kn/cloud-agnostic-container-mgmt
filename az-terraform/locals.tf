locals {
  environmentPrefix = var.environmentPrefix // "dev", "test", or "prod"
  location = var.location
  applicationGatewayName = "applicationgateway${local.environmentPrefix}"
  identityName = "appgwContrIdentity${local.environmentPrefix}"
  applicationGatewayPublicIpName = "appgwpublicip${local.environmentPrefix}"
  aksClusterName = "aks${local.environmentPrefix}"

  common_tags = {
    environment = var.environmentPrefix
    managed_by  = "terraform"
    project     = "multi-cloud-demo"
  }
}
