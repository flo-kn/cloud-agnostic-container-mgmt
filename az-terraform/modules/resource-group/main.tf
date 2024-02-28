

resource "azurerm_resource_group" "multi_cloud_demo" {
  name     = "multi-cloud-demo-rg"
  location = var.location
  tags = {
    environment = "MultiCloudHelloWorld"
  }
}