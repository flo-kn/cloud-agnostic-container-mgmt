output "subnet_aks_kubernetes_id" {
  value = azurerm_subnet.kubernetes.id
}

output "subnet_aks_appgw_id" {
  value = azurerm_subnet.aks_appgw.id
}