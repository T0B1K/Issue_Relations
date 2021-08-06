/**
 * The data should be in a json format that looks like this:
 * {"nodes": node[], "relations": relation[]}
 * 
 * a node object looks like this {"url":string, "user":string, "repository":string, "issueID":number, "title":string, "body":string, "id":string, "comments"}
 * and a relation object like this { "urlIssueA": string, "urlIssueB": string, "relation": number, "dateMentioned": date}
 * 
 * source and target are linking to the url
 */

let data = null;
let coloredRepositories = true;
let Graph = null;
const GRAPH_RELATIONS = ["🠖", "🠔", "⬌", "dupl."];
const MAX_FONT_SIZE = 10;

/**
 * This function expects a .json file with data reads it and parses the json.
 * Afterwards it creates the graph
 * The data-format is defined above.
 * @param {file} input 
 */
function readFile(input) {
    let file = input.files[0];
    let reader = new FileReader();

    reader.readAsText(file);
    reader.onload = function () {
        let jsonData = JSON.parse(reader.result);
        //data.nodes = data.nodes.slice(0,400);
        if (checkUndef(jsonData.nodes) && checkUndef(jsonData.links))
            createStandardGraph(jsonData);
        if (checkUndef(jsonData.issueTexts) && checkUndef(jsonData.relations))
            createMSGraph(jsonData);
        if (jsonData.size > 0 || checkUndef(jsonData[0].urlIssueA))
            createGraphUsingRelationFile(jsonData);
    };
    reader.onerror = function () {
        console.error(reader.error);
    };
}

/**
 * This function creates a graph out of the relationFile passe into it.
 * @param {array} jsonData 
 */
function createGraphUsingRelationFile(jsonData) {
    //jsonData = jsonData.slice(0, 20);
    coloredRepositories = false;
    let nodes = new Set();
    jsonData.forEach(rel => {
        nodes.add(rel.urlIssueA).add(rel.urlIssueB)
    });
    let nodesArray = createNodesFromUrlSet(nodes);

    data = { "nodes": nodesArray, "links": jsonData };

    createGraph();
}

/**
 * This function creates JSON (node) objects using a set of URLs.
 * @param {Set} nodesSet 
 * @returns a list of JSON (node) objects for the graph
 */
function createNodesFromUrlSet(nodesSet) {
    let nodesArray = [...nodesSet]
    let returnJSON = []
    for (nodeURL of nodesArray) {
        let decomposedURL = decomposeURL(nodeURL)
        let newJsonObject = { "url": `${nodeURL}`, "repository": `${decomposedURL.repository}`, "user": `${decomposedURL.user}`, "issueID": `${decomposedURL.issueID}`};
        returnJSON.push(newJsonObject);
    }
    return returnJSON;
}

/**
 * This function decomposes the given GitHub URL into the user, repository and issueID
 * @param string url 
 * @returns a JSON object with the issueID, user and repository
 */
function decomposeURL(url) {
    let splittedURL = url.split("/");
    let issueID = splittedURL[6],
        user = splittedURL[3],
        repository = splittedURL[4];
    return { "issueID": issueID, "user": user, "repository": repository }
}

/**
 * This function creates the graph using a the standard JSON object {nodes:...,links:...}
 * @param {JSON} jsonData 
 */
function createStandardGraph(jsonData) {
    console.info(data.links);
    data = jsonData;
    createGraph();
}

/**
 * This function creates the Graph using the data returned from the microservice, which lacks user information.
 * @param {JSON} jsonData 
 */
function createMSGraph(jsonData) {
    coloredRepositories = false;
    let nodes = jsonData.issueTexts.map((node, idx) => createNodeJson(idx));
    let relations = jsonData.relations.map((rel) => createRelJson(rel));
    let rel = relations.filter(checkUndef);

    data = { "nodes": nodes, "links": rel };
    createGraph();
}

/**
 * This function checks if a given variable is undefined
 * @param {any} variable the variable to be checked 
 * @returns a boolean whether or not the variable is undefined
 */
function checkUndef(variable) {
    return variable !== undefined
}

/**
 * This function creates node JSONs using the index of the list
 * @param {number} index the list index
 * @returns a node JSON object
 */
function createNodeJson(index) {
    return { "url": `${index}`, "repository": "", "user": "", "issueID": index }
}
/**
 * This function creates relation JSON objects out of the given relation
 * @param {*} rel The relation object consisting out of issueA,issueB and a relation number {0,1,2,3}
 * @returns The relation object
 */
function createRelJson(rel) {
    if (!checkUndef(rel.relation) || !checkUndef(rel.issueA) || !checkUndef(rel.issueB) || rel.relation > 4 || rel.relation < 1)
        return undefined;
    let relationVal = Math.abs(rel.relation-4)      //the arrays were ordered differently in python
    return { "urlIssueA": `${rel.issueA}`, "urlIssueB": `${rel.issueB}`, "relation": relationVal}
}

/**
 * This function creates the Graph
 */
function createGraph() {
    Graph = ForceGraph()
        (document.getElementById('graph'))

    Graph.graphData(data)
        .nodeId("url")
        .linkSource("urlIssueA")
        .linkTarget("urlIssueB")
        .nodeLabel((node) => displayLabelonHover(node))
        .nodeAutoColorBy('repository')
        .onNodeClick((node, event) => console.info(`clicked on issue ${node.issueID} in ${node.repository}\n link to repo: ${node.url}`))
        .linkCanvasObjectMode(() => 'after')
        .linkCanvasObject((link, ctx) => drawRelations(link, ctx));
}

/**
 * This function takes a GraphPlotLib node and creates a HTMLDivElement containing the text to be displayed on the
 * onhover event of a node
 * @param {GraphPlotLib} node 
 * @returns HTMLDivElement
 */
function displayLabelonHover(node) {
    let div = document.createElement("div");
    let title = document.createElement("div");
    let content = document.createElement("div");

    div.style = "text-align: center; line-break: auto; max-width: 500px;";
    title.style = "font-weight: bold;padding-bottom: 5px;"
    title.innerText = `${node.user} / ${node.repository}#${node.issueID}`;//`${node.title}`;
    content.innerText = `${node.url}`//`${node.body}`;

    div.appendChild(title);
    div.appendChild(content);
    return div.outerHTML
}

/**
 * This function draws the issue relations on the canvas.
 */
function drawRelations(link, ctx) {
    const LABEL_NODE_MARGIN = Graph.nodeRelSize() * 1.5;
    const start = data.nodes.filter(node => node.url == link.urlIssueA)[0];
    const end = data.nodes.filter(node => node.url == link.urlIssueB)[0];
    const label = `${GRAPH_RELATIONS[link.relation]}`;
    const relLink = { x: end.x - start.x, y: end.y - start.y };

    // ignore unbound links
    if (typeof start !== 'object' || typeof end !== 'object') return;

    // calculate label positioning
    const textPos = Object.assign(...['x', 'y'].map(c => ({
        [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
    })));

    const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 2;
    let textAngle = Math.atan2(relLink.y, relLink.x);

    const fontSize = Math.min(MAX_FONT_SIZE, maxTextLength / ctx.measureText(label).width) || 1;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

    drawTextOnCanvas(ctx, label, bckgDimensions, textPos, textAngle, fontSize)
}

/**
 * This function is used to draw a single relation
 * 
 * @param {canvas context} ctx 
 * @param {string} label 
 * @param {json} bckgDimensions 
 * @param {json} textPos 
 * @param {number} textAngle 
 */
function drawTextOnCanvas(ctx, label, bckgDimensions, textPos, textAngle, fontSize) {
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.save();
    ctx.translate(textPos.x, textPos.y);
    ctx.rotate(textAngle);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(- bckgDimensions[0] / 2, - bckgDimensions[1] / 2, ...bckgDimensions);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'darkgrey';
    ctx.fillText(label, 0, 0);
    ctx.restore();
}