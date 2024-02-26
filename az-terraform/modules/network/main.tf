
resource "azurerm_virtual_network" "vnet" {
  name                = local.vnetName
  address_space       = [var.virtualNetworkAddressPrefix]
  location            = var.location
  resource_group_name = var.resource_group_name
}

resource "azurerm_subnet" "kubernetes" {
  name                 = local.kubernetesSubnetName
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.aksSubnetAddressPrefix]
}

resource "azurerm_subnet" "aks_appgw" {
  name                 = local.applicationGatewaySubnetName
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.applicationGatewaySubnetAddressPrefix]
}