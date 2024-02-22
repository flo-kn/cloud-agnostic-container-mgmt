# Multi-Cloud - Azure Terraform k8s platform

## Account Prerequs:

- A fully fledged Azure subscription (You user needs to be able to provision resources such as vnets, aks, app registrations, app gateway)
- A license set named ["Microsoft Entra ID P2"](https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing?market=de). As of today 23.02.21, you can easily book a 1 month term 100 licenses


## Getting started

1. Create Azure Principle
    ```sh
    az ad sp create-for-rbac --name "aks-service-principle" -o json > auth.json
    # ...and save some variables to your terminal
    appId=$(jq -r ".appId" auth.json)
    password=$(jq -r ".password" auth.json)
    ```
    (Don't worry. The auth.json is part of the `.gitignore`. You should never add secrets to version control.)

    ```sh
    objectId=$(az ad sp show --id $appId --query "objectId" -o tsv)
    ```

2. Init the project 
    ```sh
    terraform init
    ```

3. Update or fill in the remaining terraform variables here in this [terraform.tfvars](./terraform.tfvars)
    _(You can set default values or pass the values in the prompt in when you `terraform apply`)_

4. Dry-Run:
    ```sh
    terraform plan -var="aksServicePrincipalAppId=${appId}" -var="aksServicePrincipalClientSecret=${password}" -var="aksServicePrincipalObjectId"=${objectId}
    ```

5. Deploy everything:
    ```sh
    terraform apply -var="aksServicePrincipalAppId=${appId}" -var="aksServicePrincipalClientSecret=${password}" -var="aksServicePrincipalObjectId"=${objectId}
    ```

6. Update you kube-config in order to interact with the k8s cluster:
    ```sh
    az aks get-credentials --resource-group multi-cloud-demo-rg --name aksdev
    ```


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
- [ ] Configure aws module linter with aws credential  https://github.com/terraform-linters/tflint-ruleset-aws/blob/master/docs/configuration.md
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
- [ ] move tf state to azure storage account
      


- [ ] This will fail initially:       "kubernetes.io/ingress.class" = "azure/application-gateway". change it to this:       "kubernetes.io/ingress.class" = "azure-application-gateway" and then back

- [ ] Make some automated deployments with e.g. ARGO CD, GH Actions

