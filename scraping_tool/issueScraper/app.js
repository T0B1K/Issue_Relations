"use strict";
exports.__esModule = true;
var interfaces_1 = require("../interfaces");
var sendRequest_1 = require("../sendRequest");
var nodes = [];
var issueRelations = [];
var NUMBER_OF_REQUESTS = 10;
var SCRAPED_ISSUE_FILE = "../../scraped_files/nodes.json", ISSUE_RELATION_FILE = "../../issue_relations/data_participant_A.txt", RELATION_FILE = "../../scraped_files/relations.json";
/**
 * This function creates nodes from the data and checks whether they are already loaded
 * - if not, it appends them to the node list
 *
 * @param data The data is the data given for creating the nodes
 */
function createNodesIfNotExist(data) {
    if (data === "")
        throw new Error("No data was present");
    var tmp = data.replace(/\s*(\<\=\>|\=\>|\<\=|\<dupl\.\>|\n)\s*/g, "#");
    var urlSet = new Set(tmp.split("#"));
    var urls = Array.from(urlSet);
    var possibleNodes = urls.map(function (url) { return new interfaces_1.DataNode(url); }); //create Datanodes from url
    possibleNodes.forEach(function (pn) {
        var found = false;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id == pn.id) {
                found = true;
                break;
            }
        }
        if (!found) { //The node wasn't loaded and therefore appended to the node list
            //console.info("appended Node")
            nodes.push(pn);
        }
    });
}
/**
 * This function iterates over the nodes present, and returns the first NUMBER_OF_REQUESTS nodes, which
 * haven't been scraped jet.
 *
 * @returns the first NUMBER_OF_REQUESTS "unscraped" nodes
 */
function getUnscrapedNodes() {
    var blankNodeIndexes = [];
    for (var i = 0; i < nodes.length; i++) {
        var dn = nodes[i];
        if (sendRequest_1.isBlank(dn.body) && sendRequest_1.isBlank(dn.title))
            blankNodeIndexes.push(i);
    }
    console.info(blankNodeIndexes);
    var slicedBlankNodeIndexes = blankNodeIndexes.slice(0, NUMBER_OF_REQUESTS);
    if (slicedBlankNodeIndexes === null) {
        throw new Error("slicedBlankNodeIndexes is null!");
    }
    return slicedBlankNodeIndexes;
}
/**
 * This function is used to load the data and create new nodes
 */
function loadDataCreateNodes() {
    Promise.all([interfaces_1.getDataFromFile(ISSUE_RELATION_FILE), interfaces_1.getDataFromFile(SCRAPED_ISSUE_FILE)])
        .then(function (values) {
        var tmp = values[1].toString(), data = values[0].toString();
        nodes = JSON.parse(tmp);
        try {
            createNodesIfNotExist(data);
            createRelations(data);
        }
        catch (error) {
            console.error(error);
        }
    }).then(function () { return getDataForNextIssues(); })["catch"](function (error) {
        console.error("An error occurred inside the second promise");
        console.error(error);
    })["finally"](function () { return interfaces_1.writeToFile(JSON.stringify(issueRelations), RELATION_FILE); });
}
/**
 * This function scrapes data and appends them onto the issues, which haven't been fully scraped.
 * Afterwards it appends the new data to tne SCRAPED_ISSUE_FILE
 */
function getDataForNextIssues() {
    var numberarray = null;
    try {
        numberarray = getUnscrapedNodes();
    }
    catch (error) {
        console.error(error);
    }
    var comments = numberarray.map(function (nr) { return sendRequest_1.sendRequest(nodes[nr], true); }), //crawl comments
    issueTitleAndBodies = numberarray.map(function (nr) { return sendRequest_1.sendRequest(nodes[nr], false); }); //crawl rest of data
    var p1 = Promise.all(comments), p2 = Promise.all(issueTitleAndBodies);
    Promise.all([p1, p2]).then(function (values) {
        for (var i = 0; i < values[0].length; i++) {
            try {
                addComments(nodes[numberarray[i]], values[0][i]);
            }
            catch (error) {
                console.error(error);
            }
        }
        for (var i = 0; i < values[1].length; i++) {
            nodes[numberarray[i]].title = values[1][i].title;
            nodes[numberarray[i]].body = values[1][i].body;
        }
    }).then(function () { return interfaces_1.writeToFile(JSON.stringify(nodes), SCRAPED_ISSUE_FILE); })["catch"](function (error) {
        console.error("An error occurred inside the first promise");
        console.error(error);
    });
    console.info(numberarray);
}
/**
 * This method is used to open the file, read the issueRElations and to create relation instances out of them
 *
 * @param data This is the data from the document
 */
function createRelations(data) {
    if (data === "")
        throw new Error("No data was present");
    var rowsInFile = data.split(/\s*\n/);
    rowsInFile.forEach(function (row) {
        var tmp = row.split(/\s*(\<\=\>|\=\>|\<\=|\<dupl\>|\<dupl\.\>|\n)\s*/);
        if (tmp.length < 3) {
            console.error("couldn't find the relations");
            console.error(tmp);
        }
        else {
            var relation = {
                urlIssueA: tmp[0],
                urlIssueB: tmp[2],
                relation: checkForRelation(tmp[1]),
                dateMentioned: null
            };
            issueRelations.push(relation);
        }
    });
}
/**
 * This function checks for the issue relations and appends them
 *
 * @param relationString the Relation in form of a string
 */
function checkForRelation(relationString) {
    if (relationString === "")
        throw new Error("No relationString was present");
    var relation = null;
    if (relationString.match(/\<\=\>/))
        relation = interfaces_1.Relation.both; //2
    else if (relationString.match(/\<dupl/))
        relation = interfaces_1.Relation.duplicate; //3
    else if (relationString.match(/\=\>/))
        relation = interfaces_1.Relation.right; //0
    else if (relationString.match(/\<\=/))
        relation = interfaces_1.Relation.left; //1
    return relation;
}
loadDataCreateNodes();
/**
 * This function takes the comments crawled by the github api and creates "Comment" objects out of them
 * afterwards it adds them to the corresponding node
 *
 * @param nodeObject The node on which to append the comments
 * @param githubApiJson The Github api response
 */
function addComments(nodeObject, githubApiJson) {
    if (nodeObject === null)
        new Error("No nodeObject given");
    var comments = [];
    githubApiJson.forEach(function (gitHubApiCommentJSON) {
        var comment = {
            createdAt: new Date(gitHubApiCommentJSON.created_at),
            updatedAt: gitHubApiCommentJSON.updated_at || null,
            body: gitHubApiCommentJSON.body
        };
        comments.push(comment);
    });
    nodeObject.comments = comments;
}
