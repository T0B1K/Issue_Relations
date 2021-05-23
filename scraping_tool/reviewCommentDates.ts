import { IssueRelation, IssueInterface, Comment, getDataFromFile, writeToFile } from "./interfaces";

const SCRAPED_ISSUE_FILE: string = "../scraped_files/nodes.json",
    RELATION_FILE = "../scraped_files/relations.json",
    FINISHED_ISSUE_RELATION_FILE: string = "../scraped_files/finishedRelations.json";

/**
 * This function is used for searching through all the relations and matching the dates to the date of the first mention between
 * the two issues
 * 
 * @param bufferedNodeData all the nodes
 * @param bufferedRelationalData all the relations
 */
function searchForDatesLogic(bufferedNodeData: Buffer, bufferedRelationalData: Buffer) {
    let nodeData: IssueInterface[] = JSON.parse(bufferedNodeData.toString()),
        relationalData: IssueRelation[] = JSON.parse(bufferedRelationalData.toString());;

    searchThroughRelations(nodeData, relationalData)
    console.info(`loaded ${nodeData.length} nodes and ${relationalData.length} relations`)
    let dataString = JSON.stringify(relationalData);
    writeToFile(dataString, FINISHED_ISSUE_RELATION_FILE);
}

/**
 * This function searches the two issues for each relation and checks afterwards at what date one of the issues was mentioned in the other one
 * 
 * @param nodeData The issues
 * @param relationalData The relations two issues are standing in
 */
function searchThroughRelations(nodeData: IssueInterface[], relationalData: IssueRelation[]) {
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
    let commentsIssueA: Comment[] = issueA.comments,
        commentsIssueB: Comment[] = issueB.comments,
        issueAID: string = `#${issueA.issueID}`,
        issueBID: string = `#${issueB.issueID}`,
        date: Date = undefined;

    date = searchThroughComments(commentsIssueA, issueB.url, issueBID)
    if (date == undefined)
        date = searchThroughComments(commentsIssueB, issueA.url, issueAID)
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
function searchThroughComments(comments: Comment[], searchTerm: string, issueId: string): Date {
    let returnDate = undefined
    if (comments == undefined) return returnDate

    comments.forEach((comment: Comment, idx) => {
        let searchTermPattern = new RegExp(searchTerm);
        let urlMentioned: number = comment.body.search(searchTermPattern),
            idMentioned: number = comment.body.search(issueId),
            patt = new RegExp(searchTerm);
        let tmp:boolean = patt.test(comment.body)
        if (tmp || urlMentioned > 0 || idMentioned >= 0)
            returnDate = new Date(comments[idx].createdAt);
            
    });
    return returnDate;
}

/**
 * This function is used for searching for the date and adding it to the relation file,
 * which is afterwards saved in the FINISHED_ISSUE_RELATION_FILE
 */
function reviewComments() {
    Promise.all([getDataFromFile(SCRAPED_ISSUE_FILE), getDataFromFile(RELATION_FILE)]).then(
        (value) => searchForDatesLogic(value[0], value[1]));
}

reviewComments();