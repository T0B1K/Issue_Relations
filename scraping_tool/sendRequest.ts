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
export async function sendRequest(node, comments:boolean) {
    //console.log(`send request ${node.user}, ${node.repository}, ${node.issueID}, ${comments}`)
    let address: string = createAddress(node.user, node.repository, `${node.issueID}`, comments);
    const response = await axios.get(address);
    return response.data;
}