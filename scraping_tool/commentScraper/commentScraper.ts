import { IssueInterface, Comment, writeToFile, getDataFromFile } from "../modules_and_interfaces/interfaces";
import { sendLongCommentsRequest } from "../modules_and_interfaces/sendRequest";

var nodes: IssueInterface[] = [];
const SCRAPED_ISSUE_FILE: string = "../../scraped_files/nodes.json",
    NUMBER_OF_REQUESTS: number = 20,
    SHIFT: number = 25;

/**
 * This function is used to load the data and create new nodes
 */
function loadNodes(): void {
    Promise.all([getDataFromFile(SCRAPED_ISSUE_FILE)])
        .then(
            values => {
                let tmp: string = values[0].toString()
                nodes = JSON.parse(tmp);

                appendCommentsToProbablyLongNodes();
            }
        );
}

/**
 * This function appends comments to the nodes which are probably long
 */
function appendCommentsToProbablyLongNodes() {
    let possibleLongComments: IssueInterface[] = nodes.filter(node => node.comments.length >= 0 && (node.comments.length == 30 || node.comments.length % 90 == 0));
    let reducedNodes = possibleLongComments.slice(SHIFT, NUMBER_OF_REQUESTS + SHIFT);

    console.info(`probably longer: ${possibleLongComments.length}`)
    console.info(reducedNodes.map(node => node.url))

    let comments = reducedNodes.map(sendLongCommentsRequest);
    try {
        Promise.all(comments).then(cl => clearnAndOrderResponse(cl))
            .finally(() => writeToFile(JSON.stringify(nodes), SCRAPED_ISSUE_FILE));
    } catch (error) {
        console.error(error)
    }
}

/**
 * This function orders the list of responses it got and appends the comments to the specific node with the same url.
 * @param commentList a list of comment lists
 */
function clearnAndOrderResponse(commentList): void {
    //console.log(commentList.length)
    if (commentList == null) throw new Error("comment list not provided")
    for (let u:number = 0; u < commentList.length; u++) {
        let tmp = commentList[u];
        if (tmp.length == 0 || tmp == undefined || tmp == null)
            continue;
        console.info(tmp[0].html_url)
        let url: string = tmp[0].html_url.split("#")[0]
        let comment = commentList[u];
        if (comment.length == 0)
            continue;
        for (let i:number = 0; i < nodes.length; i++) {
            if (nodes[i].url === url) {
                console.info(`comments_len: ${nodes[i].comments.length}`)
                try {
                    addComments(nodes[i], comment)
                } catch (error) {
                    console.error(error)
                }
                console.info(`comments_len: ${nodes[i].comments.length}`)
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
function addComments(nodeObject: IssueInterface, githubApiJson): void {
    if (nodeObject == null) throw new Error("nodeObject not provided")
    let comments = [];
    if (nodeObject.comments.length == 30)
        nodeObject.comments = [];
    githubApiJson.forEach(gitHubApiCommentJSON => {
        let comment: Comment = {
            createdAt: new Date(gitHubApiCommentJSON.created_at),
            updatedAt: gitHubApiCommentJSON.updated_at || null,
            body: gitHubApiCommentJSON.body
        }
        comments.push(comment);
    });
    nodeObject.comments.push(...comments);
}



loadNodes();