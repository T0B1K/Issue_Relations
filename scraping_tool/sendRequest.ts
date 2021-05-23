const axios = require('axios');
/**
 * Checks if the string is undefined, blank or null
 * @param str the String being checked
 */
export function isBlank(str: string) {
    return (!str || /^\s*$/.test(str));
}

/**
 * This function creates an github api address out of the given parameters
 * 
 * @param user The user of the repository
 * @param repository The repository of the issue
 * @param issueID The id of the issue.
 * @param comments Whether the comments or the issue address should be created
 */
function createAddress(user: string, repository: string, issueID: string, comments: boolean): string {
    if (isBlank(user))
        throw "no user was provided";
    if (isBlank(repository))
        throw "no repository was provided";
    if (isBlank(issueID))
        throw "no issueID was provided";
    let address: string = `https://api.github.com/repos/${user}/${repository}/issues/${issueID}`;
    if (comments)
        return `${address}/comments`;
    return address;
}

/**
 * This function is used for sending requests
 * 
 * @param node The node JSON from which the data is being provided
 * @param comments Whether the comments should be quarried or the issue itself
 */
export async function sendRequest(node, comments: boolean) {
    //console.log(`send request ${node.user}, ${node.repository}, ${node.issueID}, ${comments}`)
    let address: string = createAddress(node.user, node.repository, `${node.issueID}`, comments);
    const response = await axios.get(address);
    return response.data;
}

/**
 * This function is used for sending long requests (requests with 90 comments)
 * It automatically searches for new comments and scrapes them
 * 
 * @param node The node JSON from which the data is being provided
 * @param comments Whether the comments should be quarried or the issue itself
 */
export async function sendLongCommentsRequest(node) {
    //console.log(`send request ${node.user}, ${node.repository}, ${node.issueID}, ${comments}`)
    let address: string = createAddress(node.user, node.repository, `${node.issueID}`, true),
        page: number = getGitHubPage(node.comments.length);
    address = `${address}?per_page=90&page=${page}`
    console.log(`${address}\n nr of comments: ${node.comments.length}\tpage: ${page}`)
    const response = await axios.get(address);
    return response.data;
}
/**
 * This function returns the next page to be crawled by the github api request 
 * 
 * @param numberOfComments The number of comments in the current request
 * @returns the next page to crawl
 */
function getGitHubPage(numberOfComments: number): number {
    if (numberOfComments <= 0)
        return 0;
    else if (numberOfComments == 30)
        return 0
    else
        return 1 + (numberOfComments / 90);
}