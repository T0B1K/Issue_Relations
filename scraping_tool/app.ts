import { DataNode, IssueRelation, Relation, IssueInterface, Comment, writeToFile, getDataFromFile } from "./interfaces";
import { sendRequest, isBlank } from "./sendRequest";

var nodes: IssueInterface[] = [];
var issueRelations: IssueRelation[] = [];
const NUMBER_OF_REQUESTS: number = 10;

const SCRAPED_ISSUE_FILE: string = "../scraped_files/nodes.json",
  ISSUE_RELATION_FILE: string = "../issue_relations/data_participant_A.txt",
  RELATION_FILE = "../scraped_files/relations.json";

/**
 * This function creates nodes from the data and checks whether they are already loaded
 * - if not, it appends them to the node list
 * 
 * @param data The data is the data given for creating the nodes
 */
function createNodesIfNotExist(data: string) {
  let tmp: string = data.replace(/\s*(\<\=\>|\=\>|\<\=|\<dupl\.\>|\n)\s*/g, "#");
  let urlSet: Set<string> = new Set(tmp.split("#"));
  let urls: string[] = Array.from(urlSet);
  let possibleNodes: IssueInterface[] = urls.map(url => new DataNode(url)); //create Datanodes from url

  possibleNodes.forEach(pn => {
    let found: Boolean = false;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id == pn.id) {
        found = true;
        break;
      }
    }
    if (!found) {   //The node wasn't loaded and therefore appended to the node list
      //console.info("appended Node")
      nodes.push(pn);
    }
  })
}

/**
 * This function iterates over the nodes present, and returns the first NUMBER_OF_REQUESTS nodes, which
 * haven't been scraped jet. 
 * 
 * @returns the first NUMBER_OF_REQUESTS "unscraped" nodes
 */
function getUnscrapedNodes(): number[] {
  let blankNodeIndexes: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    let dn: IssueInterface = nodes[i]
    if (isBlank(dn.body) && isBlank(dn.title))
      blankNodeIndexes.push(i)
  }
  console.info(blankNodeIndexes)
  return blankNodeIndexes.slice(0, NUMBER_OF_REQUESTS);
}

/**
 * This function is used to load the data and create new nodes
 */
function loadDataCreateNodes(): void {
  Promise.all([getDataFromFile(ISSUE_RELATION_FILE), getDataFromFile(SCRAPED_ISSUE_FILE)])
    .then(
      values => {
        let tmp = values[1].toString(),
          data: string = values[0].toString();

        nodes = JSON.parse(tmp)
        createNodesIfNotExist(data);
        createRelations(data);
      }
    ).then(() => getDataForNextIssues()
    ).catch(function (error) {
      console.error("An error occurred inside the second promise")
      console.error(error)
    }).finally(() => writeToFile(JSON.stringify(issueRelations), RELATION_FILE));
}

/**
 * This function scrapes data and appends them onto the issues, which haven't been fully scraped. 
 * Afterwards it appends the new data to tne SCRAPED_ISSUE_FILE
 */
function getDataForNextIssues() {
  let numberarray: number[] = getUnscrapedNodes()
  let comments = numberarray.map((nr: number) => sendRequest(nodes[nr], true)), //crawl comments
    issueTitleAndBodies = numberarray.map((nr: number) => sendRequest(nodes[nr], false));  //crawl rest of data
  let p1 = Promise.all(comments),
    p2 = Promise.all(issueTitleAndBodies);

  Promise.all([p1, p2]).then(values => {    //add comments and body/title texts to the nodes
    for (let i = 0; i < values[0].length; i++) {
      addComments(nodes[numberarray[i]], values[0][i])
    }
    for (let i = 0; i < values[1].length; i++) {
      nodes[numberarray[i]].title = values[1][i].title;
      nodes[numberarray[i]].body = values[1][i].body;
    }
  }).then(() => writeToFile(JSON.stringify(nodes), SCRAPED_ISSUE_FILE)
  ).catch(function (error) {
    console.error("An error occurred inside the first promise")
    console.error(error)
  })
  console.info(numberarray)
}

/**
 * This method is used to open the file, read the issueRElations and to create relation instances out of them
 * 
 * @param data This is the data from the document
 */
function createRelations(data: string): void {
  let rowsInFile: string[] = data.split(/\s*\n/);
  rowsInFile.forEach(row => {
    let tmp = row.split(/\s*(\<\=\>|\=\>|\<\=|\<dupl\>|\<dupl\.\>|\n)\s*/);
    if (tmp.length < 3) {
      console.error("couldn't find the relations")
      console.error(tmp);
    } else {
      var relation: IssueRelation = {
        urlIssueA: tmp[0],
        urlIssueB: tmp[2],
        relation: checkForRelation(tmp[1]),
        dateMentioned: null
      }
      issueRelations.push(relation);
    }
  });
}

/**
 * This function checks for the issue relations and appends them
 * 
 * @param relationString the Relation in form of a string
 */
function checkForRelation(relationString: string): Relation {
  let relation = null;
  if (relationString.match(/\<\=\>/)) relation = Relation.both;           //2
  else if (relationString.match(/\<dupl/)) relation = Relation.duplicate  //3
  else if (relationString.match(/\=\>/)) relation = Relation.right        //0
  else if (relationString.match(/\<\=/)) relation = Relation.left;        //1
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
function addComments(nodeObject: IssueInterface, githubApiJson): void {
  let comments = [];
  githubApiJson.forEach(gitHubApiCommentJSON => {
    let comment: Comment = {
      createdAt: new Date(gitHubApiCommentJSON.created_at),
      updatedAt: gitHubApiCommentJSON.updated_at || null,
      body: gitHubApiCommentJSON.body
    }
    comments.push(comment);
  });
  nodeObject.comments = comments;
}
