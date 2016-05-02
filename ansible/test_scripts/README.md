# Experimental

#### Files in project
---
These scripts utilize and manipulate [Azure](http://portal.azure.com/) virtual machines  
[Azure-cli](https://azure.microsoft.com/en-us/documentation/articles/xplat-cli-install/) must be installed on the machine running these ansible scripts.  

Guide: https://azure.microsoft.com/en-us/documentation/articles/xplat-cli-connect/  
The user must run `azure login` on the control machine and verify their account prior to running these scripts.  
Also note your current subscription you are logged into and the cli command mode:    
* Azure Resource Manager mode - for working with Azure resources in the Resource Manager deployment model. To set this mode, run azure config mode arm.  
* Azure Service Management mode - for working with Azure resources in the classic deployment model. To set this mode, run azure config mode asm.   


> bulkdownloads.yml

- Installs node and phantom dependencies.  
- Copy phantom and node scripts over.  
- Create files and folders required for by the scripts to run.  
- Run scripts to scrape data.

> createAzureMach.yml

- Create a virtual machine on Azure

> destroyMach.yml

- Destroy an Azure machine. This script uses the expect module to respond to the text prompt azure-cli gives

> startMachine.yml 

- Start a machine on Azure.

> stopMachine.yml

- Stop a virtual machine on Azure.
