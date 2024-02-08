# Multi-Cloud - Azure Terraform k8s platform


## account Prereques:

order receipt
Your confirmation number is: 54fb1f15-e4f4-413c-a1b8-71e7412e7803
Important: To use your new licenses, make sure to assign them by editing users on the Users page.
Continue


Order details	Print
Microsoft Entra ID P2 Trial | 1 month term
100 licenses


## Getting started

create Azure Principle
```sh
az ad sp create-for-rbac --name "aks-service-principle" --skip-assignment
```

Update terraform vars:
```sh
Update your terraform.tfvars file
```

init the project 

```sh
terraform init
```


interact with the cluster. Update the cubeconfig
```sh
az aks get-credentials --resource-group causal-macaque-rg --name helloWorld
```

```sh
az role assignment create --role Contributor --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/comic-panther-rg --assignee $CLIENT_ID
```

```sh
az role assignment create --role Contributor --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/comic-panther-rg --assignee $CLIENT_ID
{
  ...
  "createdOn": "2024-02-04T14:11:12.194858+00:00",
  "delegatedManagedIdentityResourceId": null,
  "description": null,
  "id": "/subscriptions/bea4e0c6-4843-4ad8-a7da-26bf10f3ef78/resourceGroups/comic-panther-rg/providers/Microsoft.Authorization/roleAssignments/53722211-096a-4145-a43d-8b27d252b041",
  ...
}
```

```sh
az ad sp create-for-rbac --name "helm-agic-service-princ" --sdk-auth | base64 -b 0

WARNING: Option '--sdk-auth' has been deprecated and will be removed in a future release.
WARNING: The output includes credentials that you must protect. Be sure that you do not include these credentials in your code or check the credentials into your source control. For more information, see https://aka.ms/azadsp-cli
ewogICJjbGllbnRJZCI6ICJkYjUwMzc2OS0xOWNkLTQ5MzUtODRkZC1hNTc0Zjg0YjI1YzciLAogICJjbGllbnRTZWNyZXQiOiAiMDVCOFF+Lk1JRTFzSF9MTlYyRjFpbUwzTmtPaFV6bS1CbDVHSGRjUyIsCiAgInN1YnNjcmlwdGlvbklkIjogImJlYTRlMGM2LTQ4NDMtNGFkOC1hN2RhLTI2YmYxMGYzZWY3OCIsCiAgInRlbmFudElkIjogIjRmNTAxYjIxLWQyYWQtNGI1OC04ODA2LTM3OTE4NWM3ZTM3YSIsCiAgImFjdGl2ZURpcmVjdG9yeUVuZHBvaW50VXJsIjogImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbSIsCiAgInJlc291cmNlTWFuYWdlckVuZHBvaW50VXJsIjogImh0dHBzOi8vbWFuYWdlbWVudC5henVyZS5jb20vIiwKICAiYWN0aXZlRGlyZWN0b3J5R3JhcGhSZXNvdXJjZUlkIjogImh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvIiwKICAic3FsTWFuYWdlbWVudEVuZHBvaW50VXJsIjogImh0dHBzOi8vbWFuYWdlbWVudC5jb3JlLndpbmRvd3MubmV0Ojg0NDMvIiwKICAiZ2FsbGVyeUVuZHBvaW50VXJsIjogImh0dHBzOi8vZ2FsbGVyeS5henVyZS5jb20vIiwKICAibWFuYWdlbWVudEVuZHBvaW50VXJsIjogImh0dHBzOi8vbWFuYWdlbWVudC5jb3JlLndpbmRvd3MubmV0LyIKfQo=
```

Copy the base64 encoded output 

```hcl
  ...
  set_sensitive {
    name  = "armAuth.secretJSON"
    value = "<Base64EncodedJsonOutput>"
  }
  ...
```


encode the secret stuff: 
```
echo -n '{"clientId":"foo","clientSecret":"bar","subscriptionId":"buz","tenantId":"fuz"}' | base64 
```
## Refs: 
- https://developer.hashicorp.com/terraform/tutorials/kubernetes/aks
- https://github.com/Azure/application-gateway-kubernetes-ingress/blob/master/docs/setup/install-new.md
- https://learn.microsoft.com/en-us/azure/aks/use-managed-identity?source=recommendations
- https://github.com/Azure/application-gateway-kubernetes-ingress
- https://artifacthub.io/packages/helm/azure-application-gateway-kubernetes-ingress/ingress-azure?modal=values
- https://www.youtube.com/watch?v=PngRsyHyYQE
- https://github.com/HoussemDellai/docker-kubernetes-course/tree/main/35_app_gateway_ingress

## Trouble shhooting

Error: Kubernetes cluster unreachable: invalid configuration: no configuration has been provided, try setting KUBERNETES_MASTER environment variable
terraform init -upgrade 



