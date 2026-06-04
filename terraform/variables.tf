variable "subscription_id" {
  description = "Azure subscription ID"
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
  default     = "germanywestcentral"
}

variable "vm_size" {
  description = "Azure VM size"
  type        = string
  default     = "Standard_B2s"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key file"
  type        = string
  default     = "~/.ssh/aidan_azure.pub"
}
