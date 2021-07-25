"use strict";
exports.__esModule = true;
var interfaces_1 = require("../interfaces");
var SCRAPED_ISSUE_FILE = "../../scraped_files/nodes.json", RELATION_FILE = "../../scraped_files/relations.json", FINISHED_ISSUE_RELATION_FILE = "../../scraped_files/finishedRelations.json", INVALID_DATE = new Date(1900);
var issuesInBody = 0, foundInIssueAComments = 0;
/**
 * This function is used for searching through all the relations and matching the dates to the date of the first mention between
 * the two issues
 *
 * @param bufferedNodeData all the nodes
 * @param bufferedRelationalData all the relations
 */
function searchForDatesLogic(bufferedNodeData, bufferedRelationalData) {
    var nodeData = JSON.parse(bufferedNodeData.toString()), relationalData = JSON.parse(bufferedRelationalData.toString());
    try {
        searchThroughRelations(nodeData, relationalData);
    }
    catch (error) {
        console.error(error);
    }
    console.info("loaded " + nodeData.length + " nodes and " + relationalData.length + " relations");
    var dataString = JSON.stringify(relationalData);
    interfaces_1.writeToFile(dataString, FINISHED_ISSUE_RELATION_FILE);
}
/**
 * This function searches the two issues for each relation and checks afterwards at what date one of the issues was mentioned in the other one
 *
 * @param nodeData The issues themselves
 * @param relationalData The relations two issues are standing in
 */
function searchThroughRelations(nodeData, relationalData) {
    if (nodeData == null)
        throw new Error("No node Data provided");
    if (relationalData == null)
        throw new Error("No relationalData provided");
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
    if (issueA == null || issueB == null)
        throw Error("issueA or issueB is not present");
    var commentsIssueA = issueA.comments, commentsIssueB = issueB.comments, issueAID = "#" + issueA.issueID, issueBID = "#" + issueB.issueID, issueAbody = issueA.body, issueBbody = issueB.body;
    var idPatternA = new RegExp(issueAID, "i"), idPatternB = new RegExp(issueBID, "i");
    if (findUrl(issueBbody, issueA) || idPatternA.test(issueBbody) || findUrl(issueAbody, issueB) || idPatternB.test(issueAbody)) {
        issuesInBody++;
        return INVALID_DATE;
    }
    if (commentsIssueB != undefined) {
        for (var _i = 0, commentsIssueB_1 = commentsIssueB; _i < commentsIssueB_1.length; _i++) {
            var comment = commentsIssueB_1[_i];
            var body = comment.body;
            if (findUrl(body, issueA) || idPatternA.test(body)) {
                foundInIssueAComments++;
                return new Date(comment.createdAt);
            }
        }
    }
    if (commentsIssueA != undefined) {
        for (var _a = 0, commentsIssueA_1 = commentsIssueA; _a < commentsIssueA_1.length; _a++) {
            var comment = commentsIssueA_1[_a];
            var body = comment.body;
            if (findUrl(body, issueB) || idPatternB.test(body)) {
                foundInIssueAComments++;
                return new Date(comment.createdAt);
            }
        }
    }
    return null;
}
/**
 * This function searches for a issue mention in a given string and returns whether or not the issue was mentioned in this string.
 * @param string the string to search the url mention in
 * @param issue the issue from which the url and id have to be searched
 * @returns whether or not the search term was found
 */
function findUrl(string, issue) {
    if (string == null)
        return false;
    var urls = getAllUrls(string), issueID = "" + issue.issueID, searchURL = issue.url;
    if (urls === null)
        return false;
    var issueIdPattern = new RegExp(issueID, "i");
    for (var _i = 0, urls_1 = urls; _i < urls_1.length; _i++) {
        var url = urls_1[_i];
        if (url === searchURL || issueIdPattern.test(url))
            return true;
    }
    return false;
}
/**
 * This function is used for searching for the date and adding it to the relation file,
 * which is afterwards saved in the FINISHED_ISSUE_RELATION_FILE
 */
function reviewComments() {
    Promise.all([interfaces_1.getDataFromFile(SCRAPED_ISSUE_FILE), interfaces_1.getDataFromFile(RELATION_FILE)]).then(function (value) { return searchForDatesLogic(value[0], value[1]); });
}
/**
 * This method returns a list of all the URLs mentioned in the string.
 * @param str the string from which all the URls have to be extracted
 * @returns a list of valid URL strings from a given string
 */
function getAllUrls(str) {
    if (str == "")
        return [];
    //See https://www.w3resource.com/javascript-exercises/javascript-regexp-exercise-9.php
    var urlPattern = /(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?/g;
    return str.match(urlPattern);
}
reviewComments();
