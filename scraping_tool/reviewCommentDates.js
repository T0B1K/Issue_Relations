"use strict";
exports.__esModule = true;
var interfaces_1 = require("./interfaces");
var SCRAPED_ISSUE_FILE = "../scraped_files/nodes.json", RELATION_FILE = "../scraped_files/relations.json", FINISHED_ISSUE_RELATION_FILE = "../scraped_files/finishedRelations.json";
/**
 * This function is used for searching through all the relations and matching the dates to the date of the first mention between
 * the two issues
 *
 * @param bufferedNodeData all the nodes
 * @param bufferedRelationalData all the relations
 */
function searchForDatesLogic(bufferedNodeData, bufferedRelationalData) {
    var nodeData = JSON.parse(bufferedNodeData.toString()), relationalData = JSON.parse(bufferedRelationalData.toString());
    ;
    searchThroughRelations(nodeData, relationalData);
    console.info("loaded " + nodeData.length + " nodes and " + relationalData.length + " relations");
    var dataString = JSON.stringify(relationalData);
    interfaces_1.writeToFile(dataString, FINISHED_ISSUE_RELATION_FILE);
}
/**
 * This function searches the two issues for each relation and checks afterwards at what date one of the issues was mentioned in the other one
 *
 * @param nodeData The issues
 * @param relationalData The relations two issues are standing in
 */
function searchThroughRelations(nodeData, relationalData) {
    var nullCounter = 0;
    for (var _i = 0, relationalData_1 = relationalData; _i < relationalData_1.length; _i++) {
        var relation = relationalData_1[_i];
        if (relation == null)
            continue;
        var issueA = undefined, issueB = undefined;
        for (var _a = 0, nodeData_1 = nodeData; _a < nodeData_1.length; _a++) { //search for both issues involved in the relation in noteData
            var issue = nodeData_1[_a];
            if (issue == null)
                continue;
            if (issueA != undefined && issueB != undefined)
                break;
            var issueUrl = issue.url.trim();
            if (issueUrl === relation.urlIssueA.trim())
                issueA = issue;
            if (issueUrl === relation.urlIssueB.trim())
                issueB = issue;
        }
        if (issueA != undefined && issueB != undefined) { //if the issues were found - search for the mention date in the comments
            var date = searchMentionsInComments(issueA, issueB);
            if (date != undefined)
                relation.dateMentioned = date; //add the date to the relation if it was found
            else
                nullCounter++;
        }
        else
            console.error("issue a or b is undef");
    }
    console.info("for " + nullCounter + " issues no date could be found");
}
/**
 * This function is uesd to search through the comments of both issues to search on which date the issues have been mentioned.
 *
 * @param issueA The first issue
 * @param issueB The second issue
 * @returns The date of the mention
 */
function searchMentionsInComments(issueA, issueB) {
    var commentsIssueA = issueA.comments, commentsIssueB = issueB.comments, issueAID = "#" + issueA.issueID, issueBID = "#" + issueB.issueID, date = undefined;
    date = searchThroughComments(commentsIssueA, issueB.url, issueBID);
    if (date == undefined)
        date = searchThroughComments(commentsIssueB, issueA.url, issueAID);
    return date;
}
/**
 * This function searches through comments and returns the date, on which the one of the two search terms has been found.
 *
 * @param comments The comments of one issue
 * @param searchTerm The url of the other issue
 * @param issueId The issue id of the other issue
 * @returns the date on which issue was mentioned in the comments
 */
function searchThroughComments(comments, searchTerm, issueId) {
    var returnDate = undefined;
    if (comments == undefined)
        return returnDate;
    comments.forEach(function (comment, idx) {
        var searchTermPattern = new RegExp(searchTerm, "i");
        var urlMentioned = comment.body.search(searchTermPattern), idMentioned = comment.body.search(issueId);
        if (urlMentioned >= 0 || idMentioned >= 0)
            returnDate = new Date(comments[idx].createdAt);
    });
    return returnDate;
}
/**
 * This function is used for searching for the date and adding it to the relation file,
 * which is afterwards saved in the FINISHED_ISSUE_RELATION_FILE
 */
function reviewComments() {
    Promise.all([interfaces_1.getDataFromFile(SCRAPED_ISSUE_FILE), interfaces_1.getDataFromFile(RELATION_FILE)]).then(function (value) { return searchForDatesLogic(value[0], value[1]); });
}
reviewComments();
