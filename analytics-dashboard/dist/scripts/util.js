function getNodeType(attributes){
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
}

// Filters
function filterMaster(obj){
    if(obj.attributes.master == "true" && obj.attributes.data == "false"){
        return true;
    } else return false;
}
function filterData(obj){
    if(obj.attributes.master == "false" && obj.attributes.data == undefined){
        return true;
    } else return false;
}
function filterClient(obj){
    if(obj.attributes.master == "false" && obj.attributes.data == "false"){
        return true;
    } else return false;
}

// Node comparator for sorting nodes alphabetically by name
function nodeNameComparator( node_a, node_b ){
    return node_a['name'].localeCompare(node_b['name']);
}