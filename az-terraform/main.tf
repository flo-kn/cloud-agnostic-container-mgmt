
provider "azurerm" {
  features {}
}

data "azurerm_subscription" "current" {}

module "resource_group" {
  source = "./modules/resource-group"
  location = local.location
}

module "vnet" {
  source = "./modules/vnet"
  location = local.location
  resource_group_name = module.resource_group.resource_group_name
}

resource "azurerm_user_assigned_identity" "identity" {
  name                = local.identityName
  resource_group_name = module.resource_group.resource_group_name
  location            = module.resource_group.resource_group_location
}

resource "azurerm_public_ip" "appgw_public_ip" {
  name                = local.applicationGatewayPublicIpName
  location            = module.resource_group.resource_group_location
  resource_group_name = module.resource_group.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_application_gateway" "aks_appgw" {
  name                = local.applicationGatewayName
  resource_group_name = module.resource_group.resource_group_name
  location            = module.resource_group.resource_group_location

  sku {
    name     = var.applicationGatewaySku
    tier     = var.applicationGatewaySku
    capacity = 2
  }

  gateway_ip_configuration {
    name      = "appGatewayIpConfig"
    subnet_id = module.vnet.subnet_aks_appgw_id
  }

  frontend_ip_configuration {
    name                 = "appGatewayFrontendIP"
    public_ip_address_id = azurerm_public_ip.appgw_public_ip.id # Ensure you have a public IP resource defined for this
  }

  frontend_port {
    name = "httpPort"
    port = 80
  }

  frontend_port {
    name = "httpsPort"
    port = 443
  }

  backend_address_pool {
    name = "bepool"
  }

  http_listener {
    name                           = "httpListener"
    frontend_ip_configuration_name = "appGatewayFrontendIP"
    frontend_port_name             = "httpPort"
    protocol                       = "Http"
  }

  backend_http_settings {
    name                  = "setting"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 20
  }

  # Needs at least one rule
  request_routing_rule {
    name                       = "rule1"
    rule_type                  = "Basic"
    http_listener_name         = "httpListener"
    backend_address_pool_name  = "bepool"
    priority                   =  abs(100)
    backend_http_settings_name = "setting"
  }

  # Conditional WAF Configuration  
  dynamic "waf_configuration" {
    for_each = var.applicationGatewaySku == "WAF_v2" ? [1] : []
    content {
      enabled          = var.waf_enabled
      firewall_mode    = "Detection"
      rule_set_version = "3.1" # Specify the rule set version you want to use
    }
  }

  tags = {
    "managed-by-k8s-ingress" = "true"
  }

}

resource "azurerm_kubernetes_cluster" "multi_cloud_demo_aks" {
  name                = local.aksClusterName
  dns_prefix          = var.aksDnsPrefix
  sku_tier            = "Free"
  location            = module.resource_group.resource_group_location
  resource_group_name = module.resource_group.resource_group_name
  kubernetes_version  = var.kubernetesVersion
  oidc_issuer_enabled = true
  workload_identity_enabled = true

  default_node_pool {
    name            = "agentpool"
    node_count      = var.aksAgentCount
    vm_size         = var.aksAgentVMSize
    os_disk_size_gb = var.aksAgentOsDiskSizeGB
    vnet_subnet_id  = module.vnet.subnet_aks_kubernetes_id
  }

  service_principal {
    client_id     = var.aksServicePrincipalAppId
    client_secret = var.aksServicePrincipalClientSecret
  }

  network_profile {
    network_plugin     = "azure"
    // Make sure to not let this one overlap with subnet CIDR
    service_cidr       = var.aksServiceCIDR
    docker_bridge_cidr = var.aksDockerBridgeCIDR
    dns_service_ip     = var.aksDnsServiceIP
  }

  ### Come Back to this one ####
  role_based_access_control_enabled = var.aksEnableRBAC
}


###### Configure Provider #####

provider "kubernetes" {
  host                   = azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config[0].host
  client_certificate     = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config[0].client_certificate)
  client_key             = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config[0].client_key)
  cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config[0].cluster_ca_certificate)
}

# HELM stuff 
provider "helm" {
  kubernetes {
    host                   = azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config[0].host
    client_certificate     = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config[0].client_certificate)
    client_key             = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config[0].client_key)
    cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config[0].cluster_ca_certificate)
  }
}

# # Create an Azure User Assigned Identity for the workload
resource "azurerm_user_assigned_identity" "workload_identity" {
  name                = var.workload_identity
  resource_group_name = module.resource_group.resource_group_name
  location            = module.resource_group.resource_group_location
}

# # Create a Role Assignment for the Azure Identity
resource "azurerm_role_assignment" "workload_id_role" {
  scope                = "/subscriptions/${data.azurerm_subscription.current.subscription_id}/resourceGroups/${module.resource_group.resource_group_name}"
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.workload_identity.principal_id
}

resource "azurerm_federated_identity_credential" "workload_identit_federated_creds" {
  name                = azurerm_user_assigned_identity.workload_identity.name
  resource_group_name = azurerm_user_assigned_identity.workload_identity.resource_group_name
  parent_id           = azurerm_user_assigned_identity.workload_identity.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = azurerm_kubernetes_cluster.multi_cloud_demo_aks.oidc_issuer_url
  subject             = "system:serviceaccount:kube-system:agic-sa-ingress-azure"
}

resource "helm_release" "agic" {
  name       = "agic"
  repository = "https://appgwingress.blob.core.windows.net/ingress-azure-helm-package/"
  chart      = "ingress-azure"
  version    = "1.7.2"
  namespace = "kube-system"

  set {
    name  = "appgw.resourceGroup"
    value = module.resource_group.resource_group_name
  }

  set {
    name  = "appgw.name"
    value = azurerm_application_gateway.aks_appgw.name
  }

  set {
    name  = "armAuth.type"
    value = "workloadIdentity"
  }

  set_sensitive {
    name = "armAuth.identityClientID"
    value = azurerm_user_assigned_identity.workload_identity.client_id
  }

  set {
    name  = "rbac.enabled"
    value = "false"
  }
}

module "demo-app" {
  source = "./modules/demo-app"
}
