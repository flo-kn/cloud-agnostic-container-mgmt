locals {
  vnetName = "virtualnetwork"
  kubernetesSubnetName = "kubesubnet"
  kubernetesSubnetId = "${azurerm_virtual_network.vnet.id}/subnets/${local.kubernetesSubnetName}"
  applicationGatewaySubnetId = "${azurerm_virtual_network.vnet.id}/subnets/${local.applicationGatewaySubnetName}"
  applicationGatewaySubnetName = "appgwsubnet"

  vnetId = azurerm_virtual_network.vnet.id

}
