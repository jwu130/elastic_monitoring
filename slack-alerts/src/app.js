"use strict";

// Import node modules
var http = require('http');
var async = require('async');

// Import external json and js files
var slack_options = require('./config/slack_options.json');
var cluster_info = require('./config/cluster_info.json');
var utility = require('./utility/utility');

// Slack options
var options = slack_options.slackoptions;
// Slack message template
var jsonMessage = slack_options.json_message;

// Name of cluster being monitored
var cluster_name;
// Cluster API endpoint information
var cluster_status_request_opt = slack_options.cluster_status_request_opt;
var node_status_request_opt = slack_options.node_status_request_opt;

// Record of whether a slack message has been sent yet
var message_sent = {
    cluster_health: false,
    rejected_threads: false,
    disk_space: false
};

var status = "";
var nodes;

// Process the program arguments - Expect one: cluster name
// If the user has not given an argument, then exit program
if(process.argv[2] == undefined || cluster_info[process.argv[2]] == undefined) {
    console.log("Please include cluster name as the argument. Process exit.");
    process.exit();
} else {
    // Else set the global variables
    console.log("Monitoring: " + process.argv[2]);
    cluster_name = process.argv[2];
    cluster_info = cluster_info[cluster_name];
}

// True False function for array filter
// Check if the thread is past the maximum rejected thread threshold
function filterRejected(obj){
    var node_type = utility.getNodeType(this.attributes);
    if(obj.rejected >= cluster_info[node_type]["rejectedThreads"]) {
        return true;
    } else return false;
}

// Message is just sent, wait a set time before setting message_sent to false 
// (which then allows the next message to be sent)
function resetMessageTimer(check){
    message_sent[check] = true;
    setTimeout(function(){
        message_sent[check] = false;
    }, slack_options.message_reset);
}

// Check cluster and nodes by calling check functions
function checkServerHealth(){
    checkClusterStatus();
    checkNodes();
}

// Check cluster health status
function checkClusterStatus(){

    // Send http request
    var health_status_request = http.request(cluster_status_request_opt, function(res){
        res.setEncoding('utf8');
        res.on('data', function (body) {
            var body = JSON.parse(body);
            status = body.status;
        });
    });

    health_status_request.on('error', function (e) {
        console.log("problem with request " + e);
    });

    // If the cluster health is red or yellow and a message has not already been sent, send slack message
    if(status != ""){
        if(status == "red" || status == "yellow" && !message_sent.cluster_health) {
            var message = slack_options.cluster_message.replace("CLUSTER_NAME", cluster_name);
            // Modify visuals of message including: color and text
            jsonMessage.attachments[0].text = message;
            jsonMessage.attachments[0].color = slack_options.color_scheme["red"];
            utility.sendSlackMessage(jsonMessage, options);
            resetMessageTimer("cluster_health");
        } 
        status = "";
    }

    health_status_request.end();
} 

// Check the health of nodes
function checkNodes(){
    var response = "";

        // Retrieve node information through cluster api
    var rejected_threads_request = http.request(node_status_request_opt, function(res){
        res.setEncoding('utf8');
        res.on('data', function (data) {
            response += data;
        });
        res.on('end', function (){
            var nodes_stats = JSON.parse(response)["nodes"];
            nodes = Object.keys(nodes_stats).map(function(key){ return nodes_stats[key]});
        })
    });

    rejected_threads_request.on('error', function (e) {
        console.log("problem with request " + e);
    });

    if(nodes != null){
        // If there at least a certain number of rejected threads, send a message
        if(!checkRejectedThreads(nodes) && !message_sent.rejected_threads) {
            var message = slack_options.rejected_threads_message.replace("CLUSTER_NAME", cluster_name);
            // Modify visuals of message including: color and text            
            jsonMessage.attachments[0].text = message;
            jsonMessage.attachments[0].color = slack_options.color_scheme["red"];
            utility.sendSlackMessage(jsonMessage, options);
            resetMessageTimer("rejected_threads");
        } 
        // If there is any node with low disk space, send a message
        if(!checkDiskSpace(nodes) && !message_sent.disk_space) {
            var message = slack_options.disk_space_message.replace("CLUSTER_NAME", cluster_name);
            // Modify visuals of message including: color and text            
            jsonMessage.attachments[0].text = message;
            jsonMessage.attachments[0].color = slack_options.color_scheme["red"];
            utility.sendSlackMessage(jsonMessage, options);
            resetMessageTimer("disk_space");
        } 
        nodes = null;
    }

    rejected_threads_request.end();
}

// Check if nodes have threads that have been rejected
function checkRejectedThreads(nodes){    
    var failingNodeThreads = [];
    // healthy is the whether the cluster is in good shape or not in terms of rejected threads
    var healthy = true;

    // For each node, create a new array with just the threads and thread type
    // Then filter the rejected threads from the array
    // If any of the arrays of threads have a node that has too many rejected threads
    // then stop the iteration and return healthy as false
    async.detect(nodes, function(node, callback){
        node["thread_pool"] = Object.keys(node["thread_pool"]).map(function(key){
            var thread = node["thread_pool"][key];
            thread.type = key;
            return thread;
        }).filter(filterRejected, node);
        if(node.thread_pool.length > 0){
            callback(node);
        }
    }, function(result){
        if(result)
            healthy = false;
    });

    return healthy;
}

// Check if there is enough disk space left in nodes
function checkDiskSpace(nodes){
    // health is whether the cluster is in good shape or not in terms of node diskspace
    var healthy = true;

    // Check each node's file system data drives until there is one failing condition 
    async.detect(nodes, function(node, callback){
        var fs_disks = node.fs.data;
        var node_type = utility.getNodeType(node.attributes);

        // If any of the nodes have a disk that has "low" space left, return healthy is false
        async.detect(fs_disks, function(disk, callback) {
            var total_space = disk.total_in_bytes;
            var available_space = disk.available_in_bytes;

            if(available_space < cluster_info[node_type]["dataSpace"]*total_space){
                callback(disk);
            }
        }, function(result){
            if(typeof(result) != "undefined"){
                healthy = false;
            }
        });

        if(!healthy){
            callback(null, node);
        }
    }, function(err, result){
        if(err)
            console.log(err);
    });

    return healthy;
}

// Begin polling servers' health, if there has not been a message sent already within the time frame
function initiate_status_checker(){
    setTimeout(function(){
        checkServerHealth();
        initiate_status_checker();
    }, slack_options.polling_interval);
}

initiate_status_checker();