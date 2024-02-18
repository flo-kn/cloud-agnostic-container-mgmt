output "subscription_id" {
  value = data.azurerm_subscription.current.subscription_id
}
output "resource_group_name" {
  value = azurerm_resource_group.multi_cloud_demo.name
}

output "application_gateway_name" {
  value = azurerm_application_gateway.aks_appgw.name
}

output "identity_resource_id" {
  value = azurerm_user_assigned_identity.identity.id
}

output "identity_client_id" {
  value = azurerm_user_assigned_identity.identity.client_id
}

output "aks_api_server_address" {
  value = azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config.0.host
  sensitive = true
}

output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.multi_cloud_demo_aks.name
}

output "aks_cluster_oidc_rul" {
  value = azurerm_kubernetes_cluster.multi_cloud_demo_aks.oidc_issuer_url
}
