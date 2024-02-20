# Multi-Cloud - Azure Terraform k8s platform


## Account Preques :

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
az ad sp create-for-rbac --name "aks-service-principle" -o json > auth.json
appId=$(jq -r ".appId" auth.json)
password=$(jq -r ".password" auth.json)
```

```sh
objectId=$(az ad sp show --id $appId --query "objectId" -o tsv)
```

init the project 
```sh
terraform init
```

Update terraform vars:
```sh
Update your terraform.tfvars file
```
(You can set default values or pass the values in the prompt in when you `terraform apply`)

```sh
terraform plan -var="aksServicePrincipalAppId=${appId}" -var="aksServicePrincipalClientSecret=${password}" -var="aksServicePrincipalObjectId"=${objectId}
```

```sh
terraform apply -var="aksServicePrincipalAppId=${appId}" -var="aksServicePrincipalClientSecret=${password}" -var="aksServicePrincipalObjectId"=${objectId}
```

```sh
az aks get-credentials --resource-group multi-cloud-demo-rg --name aksdev
```

Export $workloadIdentity, $resourceGroupName, and $oidcUrl which should all be output of the first pt of the deployment

```sh
az identity federated-credential create \\
--name "aks-federated-credentials" \\
--identity-name $workloadIdentity \\
--resource-group $resourceGroupName \\
--issuer "${oidcUrl}" \\n--subject "system:serviceaccount:kube-system:agic-sa-ingress-azure"
```
(_As of today we do not any way to deploy federated-credentials for workload identities_)

## Refs: 
- https://developer.hashicorp.com/terraform/tutorials/kubernetes/aks
- https://github.com/Azure/application-gateway-kubernetes-ingress/blob/master/docs/setup/install-new.md
- https://learn.microsoft.com/en-us/azure/aks/use-managed-identity?source=recommendations
- https://github.com/Azure/application-gateway-kubernetes-ingress
- https://artifacthub.io/packages/helm/azure-application-gateway-kubernetes-ingress/ingress-azure?modal=values
- https://www.youtube.com/watch?v=PngRsyHyYQE
- https://github.com/HoussemDellai/docker-kubernetes-course/tree/main/35_app_gateway_ingress
- [federated identity with terraform](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/aks_workload_identity)
- [diagram for workload identity](https://azure.github.io/AKS-DevSecOps-Workshop/modules/Module1/lab-workloadidentity.html)
- [Adam Kielar - CLI way of running through](https://www.adamkielar.pl/posts/how-to-use-an-azure-ad-workload-identity-on-azure-kubernetes-service/)
- [Youtube - Adam Kielar - ](https://www.youtube.com/watch?v=vEqvEYEl8EM)

## Trouble shooting

Error: Kubernetes cluster unreachable: invalid configuration: no configuration has been provided, try setting KUBERNETES_MASTER environment variable
terraform init -upgrade 


ToDo:
Terraform the following:
- [ ] add tags
- [ ] Check if waf configuration could be optional
- [ ] Check dockerbridge if it can get removed: docker_bridge_cidr
- [ ] Add option to make RBAC true for the example
- [ ] IP Range von /8 auf mindestens /16 verringern
- [ ] aksClusterName=aks70f7
- [ ] resourceGroupName=helloWorldResourceGroup
- [ ] az aks get-credentials --resource-group $resourceGroupName --name $aksClusterName
- [ ] oidcUrl="$(az aks show --name $aksClusterName --resource-group $resourceGroupName --query "oidcIssuerProfile.issuerUrl" -o tsv)"
- [ ] echo $oidcUrl
- [ ] workloadIdentity="workload-identity"
- [ ] az identity create --name $workloadIdentity --resource-group $resourceGroupName
- [ ] clientId=$(az identity show --name $workloadIdentity --resource-group $resourceGroupName --query clientId -o tsv)
- [ ] create role assignment
      ``` 
      az role assignment create \
      --assignee $clientId \
      --role 'Contributor' \
      --scope /subscriptions/bea4e0c6-4843-4ad8-a7da-26bf10f3ef78/resourceGroups/$resourceGroupName
      ```

- [ ] code sa.yaml
      ```yaml
      apiVersion: v1
      kind: ServiceAccount
      metadata:
        annotations:
          azure.workload.identity/client-id: 08084f07-a23a-4bbf-90e3-847bacefcb55
        labels:
          azure.workload.identity/use: "true"
        name: workload-sa
        namespace: default
      ```
- [ ] kubectl apply -f sa.yaml
- [ ] helm repo add application-gateway-kubernetes-ingress https://appgwingress.blob.core.windows.net/ingress-azure-helm-package/
- [ ] helm repo update
- [ ] Install
      ```
      helm install ingress-azure \
        -f helm-config.yaml \
        application-gateway-kubernetes-ingress/ingress-azure \
        --version 1.7.2
      ```
- [ ] create federated identity
      ```
      az identity federated-credential create \
      --name "aks-federated-credential" \
      --identity-name $workloadIdentity \
      --resource-group $resourceGroupName \
      --issuer "${oidcUrl}" \
      --subject "system:serviceaccount:default:ingress-azure"
      ```
      

