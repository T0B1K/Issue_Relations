"use strict";
exports.__esModule = true;
var interfaces_1 = require("../modules_and_interfaces/interfaces");
var sendRequest_1 = require("../modules_and_interfaces/sendRequest");
var nodes = [];
var SCRAPED_ISSUE_FILE = "../../scraped_files/nodes.json", NUMBER_OF_REQUESTS = 20, SHIFT = 25;
/**
 * This function is used to load the data and create new nodes
 */
function loadNodes() {
    Promise.all([interfaces_1.getDataFromFile(SCRAPED_ISSUE_FILE)])
        .then(function (values) {
        var tmp = values[0].toString();
        nodes = JSON.parse(tmp);
        appendCommentsToProbablyLongNodes();
    });
}
/**
 * This function appends comments to the nodes which are probably long
 */
function appendCommentsToProbablyLongNodes() {
    var possibleLongComments = nodes.filter(function (node) { return node.comments.length >= 0 && (node.comments.length == 30 || node.comments.length % 90 == 0); });
    var reducedNodes = possibleLongComments.slice(SHIFT, NUMBER_OF_REQUESTS + SHIFT);
    console.info("probably longer: " + possibleLongComments.length);
    console.info(reducedNodes.map(function (node) { return node.url; }));
    var comments = reducedNodes.map(sendRequest_1.sendLongCommentsRequest);
    try {
        Promise.all(comments).then(function (cl) { return clearnAndOrderResponse(cl); })["finally"](function () { return interfaces_1.writeToFile(JSON.stringify(nodes), SCRAPED_ISSUE_FILE); });
    }
    catch (error) {
        console.error(error);
    }
}
/**
 * This function orders the list of responses it got and appends the comments to the specific node with the same url.
 * @param commentList a list of comment lists
 */
function clearnAndOrderResponse(commentList) {
    //console.log(commentList.length)
    if (commentList == null)
        throw new Error("comment list not provided");
    for (var u = 0; u < commentList.length; u++) {
        var tmp = commentList[u];
        if (tmp.length == 0 || tmp == undefined || tmp == null)
            continue;
        console.info(tmp[0].html_url);
        var url = tmp[0].html_url.split("#")[0];
        var comment = commentList[u];
        if (comment.length == 0)
            continue;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].url === url) {
                console.info("comments_len: " + nodes[i].comments.length);
                try {
                    addComments(nodes[i], comment);
                }
                catch (error) {
                    console.error(error);
                }
                console.info("comments_len: " + nodes[i].comments.length);
                break;
            }
        }
    }
}
/**
 * This function takes the comments crawled by the github api and creates "Comment" objects out of them
 * afterwards it adds them to the corresponding node
 *
 * @param nodeObject The node on which to append the comments
 * @param githubApiJson The Github api response
 */
function addComments(nodeObject, githubApiJson) {
    var _a;
    if (nodeObject == null)
        throw new Error("nodeObject not provided");
    var comments = [];
    if (nodeObject.comments.length == 30)
        nodeObject.comments = [];
    githubApiJson.forEach(function (gitHubApiCommentJSON) {
        var comment = {
            createdAt: new Date(gitHubApiCommentJSON.created_at),
            updatedAt: gitHubApiCommentJSON.updated_at || null,
            body: gitHubApiCommentJSON.body
        };
        comments.push(comment);
    });
    (_a = nodeObject.comments).push.apply(_a, comments);
}
loadNodes();
