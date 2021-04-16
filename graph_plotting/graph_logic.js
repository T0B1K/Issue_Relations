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
const GRAPH_RELATIONS = ["🠖", "🠔", "⬌", "dupl."]
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
        data = JSON.parse(reader.result);
        //data.nodes = data.nodes.slice(0,400);
        data.links = data.links.slice(0, 1700)
        console.info(data)
        createGraph()
    };
    reader.onerror = function () {
        console.error(reader.error);
    };
}

/**
 * This function creates the Graph
 */
function createGraph() {
    const Graph = ForceGraph()
        (document.getElementById('graph'))

    Graph.graphData(data)
        .nodeId("url")
        .linkSource("urlIssueA")
        .linkTarget("urlIssueB")
        .nodeLabel((node) => displayLabelonHover(node))
        .nodeAutoColorBy('repository')
        .onNodeClick((node, event) => console.log(`clicked on issue ${node.issueID} in ${node.repository}\n link to repo: ${node.url}`))
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
 * This function draws the relations on the canvas
 */
function drawRelations() {
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
function drawTextOnCanvas(ctx, label, bckgDimensions, textPos, textAngle) {
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