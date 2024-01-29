## Usage

### Getting Started

Install CDK globally
```sh
npm install -g aws-cdk  
cdk --version
```

```sh
gh repo clone flo-kn/cloud-agnostic-container-mgmt
# install dependant packages
yarn
export $ACCOUNT_ID
export $REGION
# If you have not used cdk before, you may be advised to create cdk resources
cdk bootstrap aws://$ACCOUNT_ID/$REGION
# check the diff before deployment to understand any changes, on first run all resources will created
cdk diff
# Deploy the stack, you will be prompted for confirmation for creation of IAM and Security Group resources
cdk -c cluster_name=yourCoolCluster deploy --all

```


# Ref

- Main inspiration and source [amazon-eks-using-cdk-typescript](https://github.com/aws-samples/amazon-eks-using-cdk-typescript.git)