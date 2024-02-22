# Multi-Cloud - Azure Terraform k8s platform

## Prerequs:

- A fully fledged Azure subscription (You user needs to be able to provision resources such as vnets, aks, app registrations, app gateway)
- A license set named ["Microsoft Entra ID P2"](https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing?market=de). As of today 23.02.21, you can easily book a 1 month term 100 licenses

## Dependencies

- Terraform
- linting tool: tflint -> `brew install tflint`

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

    ```
      Enter a value: yes

    module.demo-app.kubernetes_ingress_v1.nginx: Modifying... [id=default/nginx-ingress]
    module.demo-app.kubernetes_ingress_v1.nginx: Modifications complete after 0s [id=default/nginx-ingress]

    Apply complete! Resources: 0 added, 1 changed, 0 destroyed.

    Outputs:

    ...
    demo_app_public_ip_address = "http://4.185.77.79"
    ...

    ```
    Click on the IP and allow your browser to open the website.

    ![](./images/browser-nginx.png)

    Congrats! 🥳 You successfully deployed Hello World WebApp to an Azure AKS K8s Cluster exposed via AGIC enabled Azure Application Gateway


6. Update you kube-config in order to interact with the k8s cluster:
    ```sh
    az aks get-credentials --resource-group multi-cloud-demo-rg --name aksdev
    ```

## Linting

```sh
tfling
```


## Refs: 
- [Terraform Official - kubernetes](https://developer.hashicorp.com/terraform/tutorials/kubernetes/aks)
- [Azure Application Gateway](https://github.com/Azure/application-gateway-kubernetes-ingress/blob/master/docs/setup/install-new.md)
- [AKS managed identity in Azure Kubernetes Service ](https://learn.microsoft.com/en-us/azure/aks/use-managed-identity?source=recommendations)
- [Github - AGIC](https://github.com/Azure/application-gateway-kubernetes-ingress)
- [Ingress Azure Values](https://artifacthub.io/packages/helm/azure-application-gateway-kubernetes-ingress/ingress-azure?modal=values)
- [Youtube - Houssem Dellai](https://www.youtube.com/watch?v=PngRsyHyYQE)
- [Github - Installation Walkthrough from Houssem Dellai: Azure Application Gateway as Ingress Controller for AKS](https://github.com/HoussemDellai/docker-kubernetes-course/tree/main/35_app_gateway_ingress)
- [federated identity with terraform](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/aks_workload_identity)
- [Diagram for workload identity](https://azure.github.io/AKS-DevSecOps-Workshop/modules/Module1/lab-workloadidentity.html)
- [Adam Kielar - CLI way of running through](https://www.adamkielar.pl/posts/how-to-use-an-azure-ad-workload-identity-on-azure-kubernetes-service/)
- [Youtube - Adam Kielar](https://www.youtube.com/watch?v=vEqvEYEl8EM)

## Troubleshooting

- Error: `Kubernetes cluster unreachable: invalid configuration: no configuration has been provided, try setting KUBERNETES_MASTER environment variable``
  
  Fix: `terraform init -upgrade`


## Left-To-Dos:
Terraform the following:
- [ ] Configure aws module linter with aws credential  https://github.com/terraform-linters/tflint-ruleset-aws/blob/master/docs/configuration.md
- [ ] Add tags
- [x] Check if WAF configuration could be optional
- [ ] Find a way to use Application Gateway `docker_bridge_cidr`
- [ ] Add option to enable RBAC 
- [ ] Move tf state to azure storage account
- [ ] This will fail initially: 
      ```
      "kubernetes.io/ingress.class" = "azure/application-gateway"
      ```
      Change it to this:       
      ```
      "kubernetes.io/ingress.class" = "azure-application-gateway"
      ```
      and then back
- [ ] Make some automated deployments with e.g. ARGO CD, GH Actions

