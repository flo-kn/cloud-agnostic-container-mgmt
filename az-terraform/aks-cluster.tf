
provider "azurerm" {
  features {}
}

data "azurerm_subscription" "current" {}

resource "azurerm_resource_group" "multi_cloud_demo" {
  name     = "multi-cloud-demo-rg"
  location = var.location

  tags = {
    environment = "MultiCloudHelloWorld"
  }
}

resource "azurerm_user_assigned_identity" "identity" {
  name                = local.identityName
  resource_group_name = azurerm_resource_group.multi_cloud_demo.name
  location            = azurerm_resource_group.multi_cloud_demo.location
}

resource "azurerm_virtual_network" "vnet" {
  name                = local.vnetName
  address_space       = [var.virtualNetworkAddressPrefix]
  location            = azurerm_resource_group.multi_cloud_demo.location
  resource_group_name = azurerm_resource_group.multi_cloud_demo.name
}

resource "azurerm_subnet" "kubernetes" {
  name                 = local.kubernetesSubnetName
  resource_group_name  = azurerm_resource_group.multi_cloud_demo.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.aksSubnetAddressPrefix]
}

resource "azurerm_subnet" "aks_appgw" {
  name                 = local.applicationGatewaySubnetName
  resource_group_name  = azurerm_resource_group.multi_cloud_demo.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.applicationGatewaySubnetAddressPrefix]
}

resource "azurerm_public_ip" "appgw_public_ip" {
  name                = local.applicationGatewayPublicIpName
  location            = azurerm_resource_group.multi_cloud_demo.location
  resource_group_name = azurerm_resource_group.multi_cloud_demo.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_application_gateway" "aks_appgw" {
  name                = local.applicationGatewayName
  resource_group_name = azurerm_resource_group.multi_cloud_demo.name
  location            = azurerm_resource_group.multi_cloud_demo.location

  sku {
    name     = var.applicationGatewaySku
    tier     = var.applicationGatewaySku
    capacity = 2
  }

  gateway_ip_configuration {
    name      = "appGatewayIpConfig"
    subnet_id = azurerm_subnet.aks_appgw.id # Ensure you have a subnet resource defined for this
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
      enabled          = true
      firewall_mode    = "Detection"
      rule_set_version = "3.1" # Specify the rule set version you want to use
    }
  }

  tags = {
    "managed-by-k8s-ingress" = "true"
  }

  # Depends on clause handled automatically by Terraform's dependency graph
}


resource "azurerm_kubernetes_cluster" "multi_cloud_demo_aks" {
  name                = local.aksClusterName
  dns_prefix          = var.aksDnsPrefix
  # sku_tier            = "Free"
  location            = azurerm_resource_group.multi_cloud_demo.location
  resource_group_name = azurerm_resource_group.multi_cloud_demo.name
  kubernetes_version  = var.kubernetesVersion   ### CHECK and VERIFY. This could be an issue!!
  oidc_issuer_enabled = true
  workload_identity_enabled = true

  default_node_pool {
    name            = "agentpool"
    node_count      = var.aksAgentCount
    vm_size         = var.aksAgentVMSize
    os_disk_size_gb = var.aksAgentOsDiskSizeGB
    vnet_subnet_id  = azurerm_subnet.kubernetes.id
  }

  service_principal {
    client_id     = var.aksServicePrincipalAppId
    client_secret = var.aksServicePrincipalClientSecret
  }

  network_profile {
    network_plugin     = "azure"
    service_cidr       = var.aksServiceCIDR
    dns_service_ip     = var.aksDnsServiceIP
    docker_bridge_cidr = var.aksDockerBridgeCIDR
  }

  ### Come Back to this one ####
  role_based_access_control_enabled = false
}


###### Configure Provider #####

provider "kubernetes" {
  host                   = azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config.0.host
  client_certificate     = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config.0.client_certificate)
  client_key             = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config.0.client_key)
  cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config.0.cluster_ca_certificate)
}

# HELM stuff 
provider "helm" {
  kubernetes {
    host                   = azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config.0.host
    client_certificate     = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config.0.client_certificate)
    client_key             = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config.0.client_key)
    cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.multi_cloud_demo_aks.kube_config.0.cluster_ca_certificate)
  }
}

# # Create an Azure User Assigned Identity for the workload
resource "azurerm_user_assigned_identity" "workload_identity" {
  name                = var.workload_identity
  resource_group_name = azurerm_resource_group.multi_cloud_demo.name
  location            = azurerm_resource_group.multi_cloud_demo.location
}

# # Create a Role Assignment for the Azure Identity
resource "azurerm_role_assignment" "workload_id_role" {
  scope                = "/subscriptions/${data.azurerm_subscription.current.subscription_id}/resourceGroups/${azurerm_resource_group.multi_cloud_demo.name}"
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.workload_identity.principal_id
}

# # create a servcie account in our k8s cluster for the workload identity
# Is this really needed still. Comes with AGIC Helm Chart I thing
resource "kubernetes_service_account" "workload_sa" {
  metadata {
    name        = "workload-sa"
    namespace   = "kube-system"
    annotations = {
      "azure.workload.identity/client-id" = azurerm_user_assigned_identity.workload_identity.client_id
    }
    labels = {
      "azure.workload.identity/use" = "true"
    }
  }
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
    value = azurerm_resource_group.multi_cloud_demo.name
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



############# demo app ########

# Manifest stuff 

resource "kubernetes_deployment" "nginx" {
  metadata {
    name = "nginx-deployment"
    labels = {
      app = "nginx"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "nginx"
      }
    }

    template {
      metadata {
        labels = {
          app = "nginx"
        }
      }

      spec {
        container {
          image = "nginx:latest"
          name  = "nginx"
          port {
            container_port = 80
          }
        }
      }
    }
  }
}


resource "kubernetes_service" "nginx" {
  metadata {
    name = "nginx-service"
  }

  spec {
    selector = {
      app = "nginx"
    }

    port {
      port        = 80
      target_port = 80
    }

    type = "ClusterIP"
  }
}

resource "kubernetes_ingress_v1" "nginx" {
  metadata {
    name = "nginx-ingress"
    annotations = {
      "kubernetes.io/ingress.class" = "azure/application-gateway"
    }
  }

  spec {
    ingress_class_name = "azure-application-gateway"
    rule {
      http {
        path {
          path = "/"
          backend {
            service {
              name = kubernetes_service.nginx.metadata[0].name
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }
}


