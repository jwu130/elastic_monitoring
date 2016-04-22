// Import https module
var https = require('https');

module.exports = {
    // Recieves "attribute" object provided by cluster api and determine the current node's type
    getNodeType : function (attributes){
        if(attributes.master == "true" && attributes.data == "false") {
            return "master";
        }
        else if(attributes.master == "false" && attributes.data == undefined) {
            return "data";
        }
        else if(attributes.master == "false" && attributes.data == "false") {
            return "client";
        }
        else
            return "default";
    },

    // Send a slack message through slack's api
    sendSlackMessage: function (message, options) {
        var req = https.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (body) {
                console.log('Body: ' + body);
            });
        });

        req.on('error', function (e) {
            console.log("problem with request " + e);
        });

        // Write message object to request body
        req.write(JSON.stringify(message));
        req.end();
    }
}
