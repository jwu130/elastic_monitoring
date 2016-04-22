# Slack Alerts

#### A Slack webhook to help monitor the status of Elastic Search servers using the Cluster API and NodeJS

The node application sends a warning message to your Slack channel through the Slack API when your Elastic servers have the following issues:
* dangerously low amounts of memory left
* alarming status healths
* large number of rejected threads

All the threshold amounts are configurable by the user. The user must chose a cluster to monitor at the start of the application. 

The script is meant to run as a daemon and continuously polls for cluster statuses until terminated by the user.

The application can be customized to monitor Elastic servers for different statistics.

#### Pre-Requisites:

- [Elastic 2.2 or 2.3](https://www.elastic.co/)
- [Slack account](https://slack.com/)

#### Dependencies

- Node 4
- http Node Module
- https Node Module
- async Node Module
- [Cluster API 2.3](https://www.elastic.co/guide/en/elasticsearch/reference/2.3/cluster.html)
- [Slack API](https://api.slack.com/)

#### Creating the cluster_info.json file

The cluster_info.json file contains your Elastic Search Clusters information and dashboard configurations for each one. Each cluster should be representated by a object in the file with it's name as the key. 

cluster_info_template.json can be used as a template.

- the cluster_ip attribute of the cluster contains the ip and port.
- the master, data, and client attributes contain the threshold values for warning messages.

#### Creating the slack_options.json file

The slack_options.json files contains your slack webhook endpoint and slack messages preferences.
Your webhook configurations may be found on the the Slack website https://slack.com/apps/A0F7XDUAZ-incoming-webhooks  
Replace the path of the slack webhook in the configuration file shown below as "<webhook_url>" (and replace any other values as necessary)
~~~
{
	"slackoptions" : {
		"host" : "hooks.slack.com",
		"path" : "<webhook_url>",
        ...
~~~

#### Set Up

1. Set up a Incoming Webhook Integration for the Slack channel being used. Click on the link in "incoming webhook integration": https://api.slack.com/incoming-webhooks#sending_messages
2. Install nodejs version 4.X.X and npm (node package manager). Instructions can be found here: https://nodejs.org/en/download/package-manager/
3. Navigate to the directory of the cloned github. If Elastic is running on the local machine, navigate to the project dist folder, otherwise navigate to the project src folder
4. Run the following command in the command line to install all node dependencies with npm 
~~~~
npm install
~~~~
5. Create cluster_info.json file from the given template in the src\config\, or use the sample file in dist\config\
6. Create a slack_options.json file from the given template in src\config\ or modify the slack_options.json file in dist\config\  
7. Run slackAlerts.js using nodejs in the command line with the cluster name being the one string argument. ie.  
~~~~
node slackAlerts.js staging	
~~~~

---

#### Improvements/Future Extensions

- Create a separate library for handling http requests
- Monitor more than just cluster health, node disk space and threads

