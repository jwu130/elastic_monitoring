# Analytics Dashboard

#### A web application to help monitor the status of Elastic Search servers using the Cluster API

The application can serve as an alternative to the monitoring tools that Elastic Search comes with already - a dashboard allows us to easily check on what's most important. The dashboard displays the server CPU and memory usage using Google Charts Gauges. It also includes a warnings section which displays warning messages when there are a 
* dangerously low amounts of memory left
* alarming status healths
* large number of rejected threads

where all the threshold amounts are configurable by the user. The user may chose a different cluster to view on the page dynamically

The application can be customized to monitor Elastic servers for different statistics.

**Note:** *The user may open the web app once or as many times as needed. The application does not constantly poll and update the page since it was not the intention of the app, however it may easily be modified for this. One may do this with the javascript built-in setTimeout function*

#### Dependencies

- [Bootstrap 3](http://getbootstrap.com/)
- [Google Chart Tools](https://developers.google.com/chart/)
- [Cluster API 2.3](https://www.elastic.co/guide/en/elasticsearch/reference/2.3/cluster.html)

#### Creating the cluster_info.json file

The cluster_info.json file contains your Elastic Search Clusters information and dashboard configurations for each one. Each cluster should be representated by a object in the file with it's name as the key. 

cluster_info_template.json can be used as a template.

- the cluster_ip attribute of the cluster contains the ip and port.
- the master, data, and client attributes contain the threshold values for warning messages.
- the options attribute contains the configurations for the visuals of each gauge in the dashboard

An example of the cluster_info.json file is provided as cluster_info_sample.json

#### Set Up

Assuming Elastic is running on your local machine:  
- Deploy and host these files on a web server. Once the application is online, access index.html

If Elastic is running on a external server, not on your local machine:  
- Edit your config\cluster_api.json file to include the correct ip addresses. A template is provided in src\config-templates  
- Then again, deploy and host the web application on a web server

---

#### Improvements/Future Extensions

- Allow for an option to refresh the page at certain intervals
- HTTP API call can be made simply one time on the loading/re-loading of the page.
- Some servers do not specify the "attribute" attribute for the nodes: nodes are not separated as master, data, and clients. Allow the web app to work for different cluster architectures
