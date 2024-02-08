# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

variable "appId" {
  description = "Azure Kubernetes Service Cluster service principal"
}

variable "password" {
  description = "Azure Kubernetes Service Cluster password"
}

variable "ipspace" {
  description = "network cidr"
}

variable "vmPrivSubnet" {
  description = "priv subnet cidr"
}

variable "vmPubSubnet" {
  description = "pub subnet cidr"
}

