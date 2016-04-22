/**
 * Created by Teresa on 2/24/2016.
 */
 
// cluster_api.json - cluster api endpoints
var cluster_api;
// cluster_info.json - an object that contains each cluster available in the server by name
var clusters;
// A default cluster name
var default_cluster = "staging";
// Name of cluster currently being monitored
var chosen_cluster;
// Contains the information of the chosen cluster 
var cluster_info;
// warning_message.json - messages to be displayed in the message feed when issues in cluster are found
var warning_messages;

// Load the Visualization API and the gauge package.
google.charts.load('current', {packages: ['gauge']});

// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(onload);

// API Links
var nodesStatsLink = "";
var clusterHealthLink = "";

// On start-up
function onload(){

    // Import cluster api endpoints
    httpGet("config/cluster_api.json", false, function(response){
        cluster_api = JSON.parse(response);
    });

    // Import warning messages
    httpGet("config/warning_message.json", false, function(response){
       warning_messages = JSON.parse(response);
    });

    // Import warning thresholds
    httpGet("config/cluster_info.json", false, function(response){
        clusters = JSON.parse(response);
        console.log(typeof clusters + " " + JSON.stringify(clusters));

        // Update cluster drop down with names of available clusters
        var clusters_select = document.getElementById("clusters");
        for(key in clusters) {
            console.log(key);
            var option = document.createElement("option");
            option.setAttribute("value", key);
            option.innerHTML = key;
            clusters_select.appendChild(option);
        };

        // Assign urls for node statuses and cluster health
        nodesStatsLink = "http://" + clusters[default_cluster]["cluster_ip"] + cluster_api.node_stat;
        clusterHealthLink = "http://" + clusters[default_cluster]["cluster_ip"] + cluster_api.cluster_health;

        // Display current cluster on web page
        document.getElementById("cluster_selected").innerHTML = default_cluster;

        // Assign selected cluster to global variable
        cluster_info = clusters[default_cluster];
    });

    // Begin gauge and warning feed display
    if (cluster_info != null) {
        initiateDisplay();
        initiateWarningsFeed();
    }
}

// Initiate display of gauges
function initiateDisplay(){
    drawStuff("master", "jvmData");
    drawStuff("data", "jvmData");
    drawStuff("client", "jvmData");
    drawStuff("master", "cpuData");
    drawStuff("data", "cpuData");
    drawStuff("client", "cpuData");
}

// True False function for array filter
// Check if the thread is past the maximum rejected thread threshold
function filterRejected(obj){
    var node_type = getNodeType(this.attributes);

    if(obj.rejected > cluster_info[node_type]["rejectedThreads"]) {
        return true;
    } else return false;
}

// Send http request
function httpGet(theUrl, async, callback){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    };
    xmlHttp.open("GET", theUrl, async); // true for asynchronous
    xmlHttp.send(null);
}

// Separate nodes into categories
function getNodesStatus( nodes ){
    var filtered_nodes = {};
    var nodes_array;

    // Save nodes by their names
    nodes_array = Object.keys(nodes).map(function(key){ return nodes[key]});

    // Sort nodes by their type: master, data, client
    filtered_nodes["master"] = nodes_array.filter(filterMaster).sort(nodeNameComparator);
    filtered_nodes["data"] = nodes_array.filter(filterData).sort(nodeNameComparator);
    filtered_nodes["client"] = nodes_array.filter(filterClient).sort(nodeNameComparator);

    return filtered_nodes;
}

// Push java memory usage into array for display on gauge chart
// Structure: [[node_name, heap_usage], ... ]
function generateJVMData( category, nodes_stats ){
    var jvm_mem = [];

    jvm_mem = nodes_stats[category].map(function(obj){
       return [[obj.name], obj["jvm"]["mem"]["heap_used_percent"]];
    });

    return jvm_mem;
}

// Push cpu memory usage into array for display on gauge chart
// Structure: [[node_name, cpu_usage], ... ]
function generateCPUData( category, nodes_stats ){
    var cpu_data = [];

    cpu_data = nodes_stats[category].map(function(obj){
        return [[obj.name], obj["os"]["cpu_percent"]];
    });

    return cpu_data;
}

// Generate and update node status gauges 
function drawStuff( category, stat ) {

    var data = google.visualization.arrayToDataTable([
        ['Name', 'monitor']
    ]);

    var chart = new google.visualization.Gauge(document.getElementById(category + '_gauges_' + stat));

    // Send request to retrieve node information
    httpGet(nodesStatsLink, true, function (response) {
        var clusters = JSON.parse(response);
        var nodes = clusters["nodes"];
        var nodes_stats = null;
        var statuses = null;
        if (nodes != null)
            nodes_stats = getNodesStatus(nodes);
        // Restructure node status information into a structure google charts understands
        if (nodes_stats != null) {
            if(stat == "jvmData")
                statuses = generateJVMData(category, nodes_stats);
            else if(stat == "cpuData") {
                statuses = generateCPUData(category, nodes_stats);
            }
        }

        // Create a Google Charts DataTable 
        if(statuses != null){
            statuses.unshift( ['Name', stat]);
            var data = google.visualization.arrayToDataTable(statuses);
            chart.draw(data, cluster_info["options"][category][stat]);
        }
    });

    chart.draw(data, cluster_info["options"][category][stat]);
}

// Search for server issues and display to the warnings feed
function initiateWarningsFeed(){
    // Check for unhealthy cluster
    httpGet(clusterHealthLink, true, function(response){
        var cluster_health = JSON.parse(response);
        document.getElementById("cluster_status").innerHTML = "Cluster status is: " + cluster_health.status;
    });

    // Check for unhealthy nodes
    httpGet(nodesStatsLink, true, function(response){
        var nodes_stats = JSON.parse(response);
        var nodesArray = nodes_stats["nodes"];
        var nodes = Object.keys(nodesArray).map(function(key){ return nodesArray[key]});
        var failingNodeThreads = [];

        // Check for rejected threads
        // For each node that is that has rejected threads, push it to an array
        nodes.forEach(function(node, index, array){
            node["thread_pool"] = Object.keys(node["thread_pool"]).map(function(key){
                var thread_type = node["thread_pool"][key];
                thread_type.type = key;
                return thread_type;
            }).filter(filterRejected, node);
            failingNodeThreads.push(node);
        });

        // For each failing node, create a document object model object inside the warnings feed
        failingNodeThreads.forEach(function(node, index, array){
            node["thread_pool"].forEach(function(thread_type, index, array){
                // Create a row and three column objects
                var domobj = document.createElement("tr");
                var nodecol = document.createElement("td");
                nodecol.innerHTML = node.name;
                var checkcol = document.createElement("td");
                checkcol.innerHTML = warning_messages.rejected_threads;
                var informationcol = document.createElement("td");
                informationcol.innerHTML = thread_type.rejected + " " + thread_type.type + " rejected threads ";
                // Append the columns to the created row
                domobj.appendChild(nodecol);
                domobj.appendChild(checkcol);
                domobj.appendChild(informationcol);
                // Append the row to the table
                document.getElementById("warning_feed_table").appendChild(domobj);
            });
        });

        // For each node, check for data nodes out of space
        nodes.forEach(function(node, index, array){
            var fs_data_drives = node.fs.data;
            var node_type = getNodeType(node.attributes);

            // For each drive in the node, if the space available for use is less than the mininum percentage
            fs_data_drives.forEach(function(datadrive, index, array){
                var total_space = datadrive.total_in_bytes;
                var available_space = datadrive.available_in_bytes;

                if(available_space < cluster_info[node_type]["dataSpace"]*total_space){
                    console.log("node space " + node_type + " " + total_space);
                    // Create a row and three column objects
                    var domobj = document.createElement("tr");
                    var nodecol = document.createElement("td");
                    nodecol.innerHTML = node.name;
                    var checkcol = document.createElement("td");
                    checkcol.innerHTML = warning_messages.node_space;
                    var informationcol = document.createElement("td");
                    informationcol.innerHTML = Math.floor((available_space/total_space)*100) + "% left";
                    // Append the columns to the created row
                    domobj.appendChild(nodecol);
                    domobj.appendChild(checkcol);
                    domobj.appendChild(informationcol);
                    // Append the row to the table
                    document.getElementById("warning_feed_table").appendChild(domobj);
                }
            });
        });
    });
}

// When the user selects a different cluster to view, refresh the page
function refresh_page(){
    cluster_info = null;
    // New cluster to view
    chosen_cluster = document.getElementById("clusters").value;
    // Re-create the api endpoints based on the new cluster
    nodesStatsLink = "http://" + clusters[chosen_cluster]["cluster_ip"] + cluster_api.node_stat;
    clusterHealthLink = "http://" + clusters[chosen_cluster]["cluster_ip"] + cluster_api.cluster_health;

    // Retrieve information and configuration of new the cluster
    cluster_info = clusters[chosen_cluster];

    // Display name of the cluster currently being viewed
    document.getElementById("cluster_selected").innerHTML = chosen_cluster;

    // Empty warnings feed
    document.getElementById("warning_feed_table").innerHTML = "<th>Node</th><th>Check</th><th>Variable</th>";

    // Update page contents
    if (cluster_info != null) {
        initiateDisplay();
        initiateWarningsFeed();
    }
}

