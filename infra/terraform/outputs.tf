output "vm_public_ip" {
  description = "Public IP address of the VM"
  value       = azurerm_public_ip.aidan.ip_address
}

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.aidan.name
}

output "ssh_command" {
  description = "SSH command to connect to the VM"
  value       = "ssh azureuser@${azurerm_public_ip.aidan.ip_address}"
}
