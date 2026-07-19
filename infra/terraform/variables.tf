variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "tenant_id" {
  description = "Microsoft Entra tenant ID used by the GitHub OIDC identities"
  type        = string
}

variable "prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "aidan"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "polandcentral"
}

variable "vm_size" {
  description = "Azure VM size"
  type        = string
  default     = "Standard_B2als_v2"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "SSH public key content (e.g. 'ssh-rsa AAAA...')"
  type        = string
  sensitive   = true

  validation {
    condition     = length(trimspace(var.ssh_public_key)) > 0
    error_message = "ssh_public_key must not be empty — set the SSH_PUBLIC_KEY GitHub secret."
  }
}
