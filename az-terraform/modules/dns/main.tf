resource "azurerm_dns_zone" "main" {
  name                = "tp.eval.company-as-code.com"
  resource_group_name = var.resource_group_name
}