locals {
  // Assuming you have a way to generate a similar GUID in Terraform or pass it as a variable.
  resgpguid = substr(replace(uuid(), "-", ""), 0, 4)
  
  vnetName = "virtualnetwork${local.resgpguid}"
  applicationGatewayName = "applicationgateway${local.resgpguid}"
  identityName = "appgwContrIdentity${local.resgpguid}"
  applicationGatewayPublicIpName = "appgwpublicip${local.resgpguid}"
  kubernetesSubnetName = "kubesubnet"
  applicationGatewaySubnetName = "appgwsubnet"
  aksClusterName = "aks${local.resgpguid}"
  
  // Resource IDs will be constructed using Terraform's resource references.
  vnetId = azurerm_virtual_network.vnet.id
  kubernetesSubnetId = "${azurerm_virtual_network.vnet.id}/subnets/${local.kubernetesSubnetName}"
  applicationGatewaySubnetId = "${azurerm_virtual_network.vnet.id}/subnets/${local.applicationGatewaySubnetName}"
  aksClusterId = azurerm_kubernetes_cluster.multi_cloud_demo_aks.id
  networkContributorRole = "/subscriptions/${data.azurerm_subscription.current.subscription_id}/providers/Microsoft.Authorization/roleDefinitions/4d97b98b-1d4f-4787-a291-c67834d212e7"
  contributorRole = "/subscriptions/${data.azurerm_subscription.current.subscription_id}/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
  managedIdentityOperatorRole = "/subscriptions/${data.azurerm_subscription.current.subscription_id}/providers/Microsoft.Authorization/roleDefinitions/f1a07417-d97a-45cb-824c-7a7467783830"
  readerRole = "/subscriptions/${data.azurerm_subscription.current.subscription_id}/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7"

  webApplicationFirewallConfiguration = {
    enabled     = true
    firewallMode = "Detection"
  }
}
