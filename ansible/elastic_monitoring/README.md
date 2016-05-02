# Elastic Monitoring Tools Automated Configuration and Set Up

#### Overview
---

This folder contains the scripts and resources for automating most of the configuration, deployment, and maintainance of the Elastic Monitoring Tools including hosting the Analytics Dashboard on Apache and running the Slack Alerts daemon on [Microsoft Azure](http://portal.azure.com/) virtual machines. 

The user must run `azure login` on the control machine and verify their account prior to running these scripts.  
Azure cli login guide: https://azure.microsoft.com/en-us/documentation/articles/xplat-cli-connect/  
Also note your current subscription you are logged into and the cli command mode:    
* Azure Resource Manager mode - for working with Azure resources in the Resource Manager deployment model. To set this mode, run azure config mode arm.  
* Azure Service Management mode - for working with Azure resources in the classic deployment model. To set this mode, run azure config mode asm.   

The nodes in the cluster being monitored are expected to be separated as master, data, and client.


#### Instructions to deploy analytics dashboard distribution to a Azure VM
---

*This assumes that the Elastic servers will be started up on the newly created machine the local machine and accessable at prot 9200*

1. Edit variable file machine_vars.yml so that it contains the configurations you would like your new Azure vm to have
2. Run create_azure_machine.yml with `ansible-playbook -k create_azure_machine.yml` 
    - --Note this will replace your control machine hosts file
3. Run update_install.yml with `ansible-playbook -k update_install.yml`  
    - --This may take a while to run
4. Start up Elastic on the new Azure VM created
5. Run dashboard_init.yml with `ansible-playbook -k dashboard_init.yml`
    - --This will prompt you for your slack webhook path
    - --This will replace your remote machine's apache main configuration file

**Developers Note:** *Local actions that uses azure cli should use become_user* 

#### Project files
---

The files are expected to be run in this order (Descriptions provided):
> create_azure_machine.yml  

- Create a new VM instance on Microsoft Azure
- Re-write control machine's ansible host file so that it contains the new VM's ip address

> update_install.yml

- Updates apt-get
- Installs all dependencies:
    - git
    - python-pexpect
    - apache2
    - nodejs
    - build-essential
    - daemon

> dashboard_init.yml

- Checks out the Git elastic-monitor-tools repository
- Configures and starts an Apache instance
- Moves the dashboard files to the proper folders so the website can be public
- Runs the Slack alerts script in the background

**Vars:**
> apache_vars.yml

- contains the values meant to be used when generating the apache.config file 

> localhost_vars.html

- contains information related to the local machine where the ansible scripts are running on

> machine_vars.yml

- contains the configurations for creating a new virtual machine on Microsoft Azure Cloud Platform

> remote_mach_vars.yml

- contains information related to the remote machine that ansible is connecting to through ssh

**Templates:**
> apache2.j2

- This is a template for the main Apache server configuration file. This allows us to host a apache server regardless of the server's ip

> hostfile_template.js

- This is a template host file for ansible typcially stored in /etc/ansible/hosts in linux machines.

> dashboard.j2

- This is a template virtual host file for apache. These are your configurations for a particular domain name on your server

> machine_ip.j2

- This is a template variable file used by dashboard_init.yml when attempting to create a var file that contains a newly created virtual machine's ip address

#### What I didn't get to
---

- Create an Azure machine with no dns label, a public ip, and set it's network interface security group 
- Modify that Ansible playbook to have two modes. One is in install and the other is in update mode, where the install mode runs all the tasks above and update role only updates the files.
- Update ansible host file on the current machine rather than replace it. The add_host ansible module should allow you to add a host to the machine without destroying the host file:
```
add_host: hostname={{ ip_address }} groups=innodash ansible_user="monitor"
```

#### Issue I ran into
---

- When attempting to separate the tasks into tasks files and run one script that combined them, the scripts were attempting to connect to the new machine before the host file was re-written

#### Future extensions
---

- Modify the script so that it can deploy any web app to an Apache web server
- Have it an option for the user to chose between regular vm create or quick-create
