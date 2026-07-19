# Importing the existing Azure deployment

The Terraform workflow deliberately cannot create the state backend or import
live resources. Those are privileged, one-time operations and must be run by
an operator who has checked the live Azure names and IDs.

Before the first protected apply:

1. Create a dedicated resource group, storage account, and private Blob
   container for Terraform state. Enable blob versioning and use Entra ID/RBAC
   rather than storage-account keys. Configure the repository variables
   `AZURE_TF_STATE_RESOURCE_GROUP`, `AZURE_TF_STATE_STORAGE_ACCOUNT`,
   `AZURE_TF_STATE_CONTAINER`, and `AZURE_TF_STATE_KEY`.
2. Create two GitHub OIDC federated credentials restricted to this repository:
   a plan identity with Reader on the application resource group and Storage
   Blob Data Reader on the state container, and an apply identity with only
   the required contributor permissions plus Storage Blob Data Contributor.
   Configure `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`,
   `AZURE_TERRAFORM_PLAN_CLIENT_ID`, and
   `AZURE_TERRAFORM_APPLY_CLIENT_ID` as repository/environment variables.
3. Initialize the backend with the same `-backend-config` values used in
   `.github/workflows/terraform.yml`, then import each existing object using
   its Azure resource ID. The expected Terraform addresses are:

   ```text
   azurerm_resource_group.aidan
   azurerm_virtual_network.aidan
   azurerm_subnet.aidan
   azurerm_network_security_group.aidan
   azurerm_public_ip.aidan
   azurerm_network_interface.aidan
   azurerm_network_interface_security_group_association.aidan
   azurerm_linux_virtual_machine.aidan
   ```

4. Run `terraform plan` after every import and reconcile configuration to the
   live resource before applying. Do not use an apply to resolve unexpected
   deletes or replacements. The first successful plan must be zero-change.

The committed provider lock file is generated from `terraform init` and should
be reviewed with provider upgrades like any other dependency change.
