terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id                = var.subscription_id
  resource_provider_registrations = "none"
}

resource "azurerm_resource_group" "aidan" {
  name     = "${var.prefix}-rg"
  location = var.location
}

resource "azurerm_virtual_network" "aidan" {
  name                = "${var.prefix}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.aidan.location
  resource_group_name = azurerm_resource_group.aidan.name
}

resource "azurerm_subnet" "aidan" {
  name                 = "${var.prefix}-subnet"
  resource_group_name  = azurerm_resource_group.aidan.name
  virtual_network_name = azurerm_virtual_network.aidan.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_network_security_group" "aidan" {
  name                = "${var.prefix}-nsg"
  location            = azurerm_resource_group.aidan.location
  resource_group_name = azurerm_resource_group.aidan.name

  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTP"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTPS"
    priority                   = 1003
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "API"
    priority                   = 1004
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8080"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  security_rule {
    name                       = "Grafana"
    priority                   = 1005
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3001"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_public_ip" "aidan" {
  name                = "${var.prefix}-pip"
  location            = azurerm_resource_group.aidan.location
  resource_group_name = azurerm_resource_group.aidan.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_network_interface" "aidan" {
  name                = "${var.prefix}-nic"
  location            = azurerm_resource_group.aidan.location
  resource_group_name = azurerm_resource_group.aidan.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.aidan.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.aidan.id
  }
}

resource "azurerm_network_interface_security_group_association" "aidan" {
  network_interface_id      = azurerm_network_interface.aidan.id
  network_security_group_id = azurerm_network_security_group.aidan.id
}

resource "azurerm_linux_virtual_machine" "aidan" {
  name                = "${var.prefix}-vm"
  resource_group_name = azurerm_resource_group.aidan.name
  location            = azurerm_resource_group.aidan.location
  size                = var.vm_size
  admin_username      = var.admin_username

  network_interface_ids = [
    azurerm_network_interface.aidan.id,
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.ssh_public_key_path)
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }
}
