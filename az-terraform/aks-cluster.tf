resource "random_pet" "prefix" {}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "mulit_cloud_hw" {
  name     = "${random_pet.prefix.id}-rg"
  location = "Germany West Central"

  tags = {
    environment = "MultiCloudHelloWorld"
  }
}

# Network

resource "azurerm_virtual_network" "vnet" {
    name                        = "vnet"
    location                    = azurerm_resource_group.mulit_cloud_hw.location
    resource_group_name         = azurerm_resource_group.mulit_cloud_hw.name
    address_space               = [var.ipspace]
    tags                        = {
    environment = "MultiCloudHelloWorld"
  }
}

# Subnets

resource "azurerm_subnet" "aks_subnet" {
  name                 = "myAKSSubnetPublic"
  resource_group_name  = azurerm_resource_group.mulit_cloud_hw.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.vmPrivSubnet]
  
}

resource "azurerm_subnet" "app_gateway_subnet" {
  name                 = "myAKSSubnetPrivate"
  resource_group_name  = azurerm_resource_group.mulit_cloud_hw.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.vmPubSubnet]
}

# Base Identity for managing AKS
resource "azurerm_user_assigned_identity" "base" {
  name                = "base"
  location            = azurerm_resource_group.mulit_cloud_hw.location
  resource_group_name = azurerm_resource_group.mulit_cloud_hw.name
}

resource "azurerm_role_assignment" "base" {
  scope                = azurerm_resource_group.mulit_cloud_hw.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.base.principal_id
}

# Create an AKS cluster
resource "azurerm_kubernetes_cluster" "mulit_cloud_hw" {
  name                      = "helloWorld"
  sku_tier                  = "Free"
  kubernetes_version        =  "1.27.7"
  location                  = azurerm_resource_group.mulit_cloud_hw.location
  resource_group_name       = azurerm_resource_group.mulit_cloud_hw.name
  dns_prefix                = "helloWorld"
  workload_identity_enabled = true
  oidc_issuer_enabled       = true

  default_node_pool {
    name            = "helloworld"
    node_count      = 2
    vm_size         = "Standard_D2_v2"
    os_disk_size_gb = 30
    vnet_subnet_id  = azurerm_subnet.aks_subnet.id
  }

  network_profile {
    network_plugin    = "azure"  # or "azure" depending on your requirement
    service_cidr      = "10.2.0.0/16" #some none overlapping from the outer one
    dns_service_ip    = "10.2.0.10"
   }

   identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.base.id]
  }

  # service_principal {
  #   client_id     = var.appId
  #   client_secret = var.password
  # }

  role_based_access_control_enabled = false

  tags = {
    environment = "HelloWorld"
  }

  depends_on = [
    azurerm_role_assignment.base
  ]
}


# setup prerequs for workload identiy
# resource "azurerm_user_assigned_identity" "helloworld_azure_identity" {
#   resource_group_name = azurerm_resource_group.mulit_cloud_hw.name
#   location            = azurerm_resource_group.mulit_cloud_hw.location
#   name                = "helloworld-azure-identity"
# }

# resource "azurerm_role_assignment" "helloworld_azure_role_assignment" {
#   scope                = azurerm_resource_group.mulit_cloud_hw.id
#   role_definition_name = "Contributor"
#   principal_id         = azurerm_user_assigned_identity.helloworld_azure_identity.principal_id
# }


resource "azurerm_user_assigned_identity" "dev_test" {
  name                = "dev-test"
  location            = azurerm_resource_group.mulit_cloud_hw.location
  resource_group_name = azurerm_resource_group.mulit_cloud_hw.name
}

resource "azurerm_federated_identity_credential" "dev_test" {
  name                = "dev-test"
  resource_group_name = azurerm_resource_group.mulit_cloud_hw.name
  audience            = ["api://AzureADTokenExchange"]
  issuer              = azurerm_kubernetes_cluster.mulit_cloud_hw.oidc_issuer_url
  parent_id           = azurerm_user_assigned_identity.dev_test.id
  subject             = "system:serviceaccount:dev:my-account"

  depends_on = [azurerm_kubernetes_cluster.mulit_cloud_hw]
}

# Configure Provider

provider "kubernetes" {
  host                   = azurerm_kubernetes_cluster.mulit_cloud_hw.kube_config.0.host
  client_certificate     = base64decode(azurerm_kubernetes_cluster.mulit_cloud_hw.kube_config.0.client_certificate)
  client_key             = base64decode(azurerm_kubernetes_cluster.mulit_cloud_hw.kube_config.0.client_key)
  cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.mulit_cloud_hw.kube_config.0.cluster_ca_certificate)
}


# resource "kubernetes_manifest" "aad_pod_identity" {
#   manifest = yamldecode(file("${path.module}/aad-pod-deployment.yaml"))
# }

# Todo: Install HELM chart of AAD Pod thingy


# HELM stuff 
provider "helm" {
  kubernetes {
    host                   = azurerm_kubernetes_cluster.mulit_cloud_hw.kube_config.0.host
    client_certificate     = base64decode(azurerm_kubernetes_cluster.mulit_cloud_hw.kube_config.0.client_certificate)
    client_key             = base64decode(azurerm_kubernetes_cluster.mulit_cloud_hw.kube_config.0.client_key)
    cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.mulit_cloud_hw.kube_config.0.cluster_ca_certificate)
  }
}

# Application Gateway and Ingress Controller setup will be more complex and depend on specific requirements.
# Basic setup of Application Gateway (without detailed ingress controller configuration)

resource "azurerm_application_gateway" "aks_appgw" {
  name                = "helloWorldAppGateway"
  location            = azurerm_resource_group.mulit_cloud_hw.location
  resource_group_name = azurerm_resource_group.mulit_cloud_hw.name

  sku {
    name     = "Standard_v2"
    tier     = "Standard_v2"
    capacity = 2
  }

  gateway_ip_configuration {
    name      = "helloWorldGatewayIpConfig"
    subnet_id = azurerm_subnet.app_gateway_subnet.id
  }

  frontend_port {
    name = "httpPort"
    port = 80
  }

  frontend_ip_configuration {
    name                 = "publicIpAddress"
    public_ip_address_id = azurerm_public_ip.aks_appgw_public_ip.id
  }

  backend_address_pool {
    name = "appGatewayBackendPool"
    ip_addresses = []
  }

  backend_http_settings {
    name                  = "httpSetting"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 20
  }

  http_listener {
    name                           = "listener"
    frontend_ip_configuration_name = "publicIpAddress"
    frontend_port_name             = "httpPort"
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = "rule1"
    priority                   = abs(100)
    rule_type                  = "Basic"
    http_listener_name         = "listener"
    backend_address_pool_name  = "appGatewayBackendPool"
    backend_http_settings_name = "httpSetting"
  }
}

resource "azurerm_public_ip" "aks_appgw_public_ip" {
  name                = "helloWorldAppGatewayPublicIp"
  location            = azurerm_resource_group.mulit_cloud_hw.location
  resource_group_name = azurerm_resource_group.mulit_cloud_hw.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# # # get more infos about values here: https://github.com/Azure/application-gateway-kubernetes-ingress/blob/master/helm/ingress-azure/values.yaml

# Get the AAD Pod Stuff first
# resource "helm_release" "aad_pod_identity" {
#   name       = "aad-pod-identity"
#   repository = "https://raw.githubusercontent.com/Azure/aad-pod-identity"
#   chart      = "aad-pod-identity"
#   version    = "1.8.6"
# }

resource "helm_release" "agic" {
  name       = "agic"
  repository = "https://appgwingress.blob.core.windows.net/ingress-azure-helm-package/"
  chart      = "ingress-azure"
  version    = "1.7.3-rc1"
  namespace = "kube-system"

  set {
    name  = "appgw.resourceGroup"
    value = azurerm_resource_group.mulit_cloud_hw.name
  }

  set {
    name  = "appgw.name"
    value = azurerm_application_gateway.aks_appgw.name
  }

  # set {
  #   name  = "armAuth.type"
  #   value = "servicePrincipal"
  # }

  set {
    name  = "armAuth.type"
    value = "aadPodIdentity"
  }

  set_sensitive {
    name = "armAuth.identityResourceID"
    value =  "zzzzxx-eeee-qqqq-9af8-tttteee"
  }

  set_sensitive {
    name = "armAuth.identityClientID"
    value = "/subscriptions/bea4e0c6-4843-4ad8-a7da-26bf10f3ef78/resourcegroups/neat-possum-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/base"
  }

  # armAuth:
  #   type: aadPodIdentity
  #   identityResourceID: /subscriptions/123445-4843-4ad8-a7da-1234566/resourceGroups/MyResourceGroup/providers/Microsoft.ManagedIdentity/userAssignedIdentities/appgwContrIdentityf37c
  #   identityClientID:  yyyyy-xxxx-4a7f-92ba-uuuu



  # set_sensitive {
  #   name  = "armAuth.secretJSON"
  #   value = "ewovudxxxxxxxxxbmV0LyIKfQo="
  # }

  set {
    name  = "rbac.enabled"
    value = "true"
  }
}


# # Manifest stuff 
# resource "kubernetes_deployment" "nginx_helloworld" {
#   metadata {
#     name = "nginx-helloworld"
#   }
#   spec {
#     replicas = 1
#     selector {
#       match_labels = {
#         app = "nginx-helloworld"
#       }
#     }
#     template {
#       metadata {
#         labels = {
#           app = "nginx-helloworld"
#         }
#       }
#       spec {
#         container {
#           image = "nginx"
#           name  = "nginx"
#           port {
#             container_port = 80
#           }
#         }
#       }
#     }
#   }
# }

# resource "kubernetes_service" "nginx_helloworld_service" {
#   metadata {
#     name = "nginx-helloworld-service"
#   }
#   spec {
#     selector = {
#       app = "nginx-helloworld"
#     }
#     port {
#       port        = 80
#       target_port = 80
#     }
#     type = "ClusterIP"
#   }
# }



# resource "kubernetes_ingress_v1" "nginx_helloworld_ingress" {
#   metadata {
#     name = "nginx-helloworld-ingress"
#     namespace = "default"
#     # hardcoded cause we know that ACID brings in this name
#     annotations = {
#       "kubernetes.io/ingress.class" = "azure-application-gateway"

#     }
#   }
#   spec {
#     ingress_class_name = "azure-application-gateway"
#     rule {
#       http {
#         path {
#           path = "/"
#           path_type = "Prefix"
#           backend {
#             service {
#               name = kubernetes_service.nginx_helloworld_service.metadata[0].name
#               port {
#                 number = 80
#               }
#             }
#           }
#         }
#       }
#     }
#   }
# }











# resource "kubernetes_manifest" "ingress_class_azure_appgw" {
#   manifest = {
#     apiVersion = "networking.k8s.io/v1"
#     kind       = "IngressClass"
#     metadata = {
#       name = "azure-application-gateway"
#     }
#     spec = {
#       controller = "azure/application-gateway"
#     }
#   }
# }

