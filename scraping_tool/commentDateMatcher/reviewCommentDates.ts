import { IssueRelation, IssueInterface, Comment, getDataFromFile, writeToFile } from "../modules_and_interfaces/interfaces";

const SCRAPED_ISSUE_FILE: string = "../../scraped_files/nodes.json",
    RELATION_FILE = "../../scraped_files/relations.json",
    FINISHED_ISSUE_RELATION_FILE: string = "../../scraped_files/finishedRelations.json",
    INVALID_DATE:Date = new Date(1900);

var issuesInBody:number = 0,
    foundInIssueAComments:number = 0;
/**
 * This function is used for searching through all the relations and matching the dates to the date of the first mention between
 * the two issues
 * 
 * @param bufferedNodeData all the nodes
 * @param bufferedRelationalData all the relations
 */
function searchForDatesLogic(bufferedNodeData: Buffer, bufferedRelationalData: Buffer) {
    let nodeData: IssueInterface[] = JSON.parse(bufferedNodeData.toString()),
        relationalData: IssueRelation[] = JSON.parse(bufferedRelationalData.toString());
    try {
        searchThroughRelations(nodeData, relationalData)
    } catch (error) {
        console.error(error)
    }
    console.info(`loaded ${nodeData.length} nodes and ${relationalData.length} relations`)
    let dataString = JSON.stringify(relationalData);
    writeToFile(dataString, FINISHED_ISSUE_RELATION_FILE);
}

/**
 * This function searches the two issues for each relation and checks afterwards at what date one of the issues was mentioned in the other one
 * 
 * @param nodeData The issues themselves
 * @param relationalData The relations two issues are standing in
 */
function searchThroughRelations(nodeData: IssueInterface[], relationalData: IssueRelation[]) {
    if(nodeData==null) throw new Error("No node Data provided");
    if(relationalData==null) throw new Error("No relationalData provided");
    let nullCounter: number = 0;
    for (let relation of relationalData) {
        if (relation == null) continue;
        let issueA: IssueInterface = undefined, issueB: IssueInterface = undefined;

        for (let issue of nodeData) {                                   //search for both issues involved in the relation in noteData
            if (issue == null) continue;
            if (issueA != undefined && issueB != undefined) break;
            let issueUrl = issue.url.trim();
            if (issueUrl === relation.urlIssueA.trim()) issueA = issue;
            if (issueUrl === relation.urlIssueB.trim()) issueB = issue;
        }
        if (issueA != undefined && issueB != undefined) {               //if the issues were found - search for the mention date in the comments
            let date = searchMentionsInComments(issueA, issueB);
            if (date != undefined) relation.dateMentioned = date;       //add the date to the relation if it was found
            else nullCounter++;
        } else console.error("issue a or b is undef")
    }
    console.info(`for ${nullCounter} issues no date could be found`)
}


/**
 * This function is uesd to search through the comments of both issues to search on which date the issues have been mentioned.
 * 
 * @param issueA The first issue
 * @param issueB The second issue
 * @returns The date of the mention
 */
function searchMentionsInComments(issueA: IssueInterface, issueB: IssueInterface): Date {
    if(issueA == null || issueB == null) throw Error("issueA or issueB is not present")
    let commentsIssueA: Comment[] = issueA.comments,
        commentsIssueB: Comment[] = issueB.comments,
        issueAID: string = `#${issueA.issueID}`,
        issueBID: string = `#${issueB.issueID}`,
        issueAbody = issueA.body,
        issueBbody = issueB.body;
    let idPatternA = new RegExp(issueAID, "i"),
        idPatternB = new RegExp(issueBID, "i");

    if (findUrl(issueBbody, issueA) || idPatternA.test(issueBbody) || findUrl(issueAbody, issueB) || idPatternB.test(issueAbody)) {
        issuesInBody++;
        return INVALID_DATE;
    }
    if (commentsIssueB != undefined) {
        for (var comment of commentsIssueB) {
            let body = comment.body
            if (findUrl(body, issueA) || idPatternA.test(body)) {
                foundInIssueAComments++;
                return new Date(comment.createdAt);
            }
        }
    }
    if (commentsIssueA != undefined) {
        for (var comment of commentsIssueA) {
            let body = comment.body
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
function findUrl(string: string, issue: IssueInterface): boolean {
    if(string == null) return false;
    let urls: string[] = getAllUrls(string),
        issueID: string = `${issue.issueID}`,
        searchURL: string = issue.url;
    if (urls === null)
        return false;
    let issueIdPattern = new RegExp(issueID, "i");
    for (let url of urls) {
        if (url === searchURL || issueIdPattern.test(url))
            return true
    }
    return false
}

/**
 * This function is used for searching for the date and adding it to the relation file,
 * which is afterwards saved in the FINISHED_ISSUE_RELATION_FILE
 */
function reviewComments() {
    Promise.all([getDataFromFile(SCRAPED_ISSUE_FILE), getDataFromFile(RELATION_FILE)]).then(
        (value) => searchForDatesLogic(value[0], value[1]));
}

/**
 * This method returns a list of all the URLs mentioned in the string.
 * @param str the string from which all the URls have to be extracted
 * @returns a list of valid URL strings from a given string
 */
function getAllUrls(str: string): string[] {
    if(str=="") return [];
    //See https://www.w3resource.com/javascript-exercises/javascript-regexp-exercise-9.php
    let urlPattern = /(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?/g;
    return str.match(urlPattern);
}

reviewComments();