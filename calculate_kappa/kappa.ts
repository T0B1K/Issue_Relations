import { promises as fs } from 'fs';

let persARelation: RelationData[] = [],
    persBRelation: RelationData[] = [];

const fileA: string = "../issue_relations/data_participant_A.txt",
    fileB: string = "../issue_relations/data_participant_B.txt";

interface RelationData {
    issueA: string,
    issueB: string,
    rel: number
}

/**
 * This function opens a file.
 * firstFile decides whether the file is fileA or fileB
 * 
 * @param firstFile decides whether it is fileA
 * @returns the buffered data
 */
async function getDataFromFile(firstFile: Boolean): Promise<Buffer> {
    let data;
    if (firstFile) {
        data = await fs.readFile(fileA, "utf8");
    } else {
        data = await fs.readFile(fileB, "utf8");
    }
    return Buffer.from(data);
}

/**
 * This function splits the document string into its rows and performs the function *createRelationsFromString*
 * on all the rows
 * 
 * @param document The document containing the issue URL's and their relation
 * @param replacePatternA 
 */
function createRelations(document: string, replacePatternA: boolean) {
    if(document === "") throw new Error("No document name provided")
    let rows: string[] = document.split(/\s*\n/);
    rows.forEach(row => createRelationsFromString(row, replacePatternA));
}

/**
 * This function splits the row into the two URL's and their relation, creates a RelationObject out of it and appends
 * it to either the persARelation or persBRelation
 * 
 * @param row A string of the form urlA pattern urlB
 * @param replacePatternA used to switch between the two different patterns
 */
function createRelationsFromString(row: string, replacePatternA: boolean) {
    let tmp: string[] = []
    if (replacePatternA) {
        row = row.replace(/\[\s*dup\s*\]/g, "<dupl.>")
        row = row.replace(/(\[|\])/g, "")
    }
    tmp = row.split(/\s*(\<\=\>|\=\>|\<\=|\<dupl.?\>|\n)\s*/);

    if (tmp.length < 3) {
        //Errors are unavoidable - instead of throwing an exception discard the row and log it
        console.error(`formatting error with:`);
        console.error(tmp);
    } else {
        let relData: RelationData = { issueA: tmp[0], issueB: tmp[2], rel: checkForRelation(tmp[1]) };
        if (replacePatternA) {
            persBRelation.push(relData)
        } else {
            persARelation.push(relData)
        }
    }
}

/**
 * This function searches for the different string types and returns the number of the relation
 * <=> == 0; <dupl.> == 1; => == 2; <= == 3; -1 == not found
 * 
 * @param str the relation in form of a string one of {=>, <=>, <dupl.>, <=}
 * @returns the relation number matching the relation
 */
function checkForRelation(str: string): number {
    if(str === "") throw new Error("No relation-string provided")
    let relation = -1;
    if (str === "")
        return relation
    if (str.match(/\<\=\>/))
        relation = 0;
    else if (str.match(/\<dupl/))
        relation = 1
    else if (str.match(/\=\>/))
        relation = 2
    else if (str.match(/\<\=/))
        relation = 3;
    return relation;
}

/**
 * This function iterates of the persARelation and persBRelation to search for instances
 * on which both URL's match. If this is the case, a tuple containing both relation numbers is created.
 * The list of all the tuples gets returned
 * 
 * @returns list of matches
 */
function matchRelations(): number[][] {
    if (persARelation.length == 0 || persBRelation.length == 0)
        return []
    let matches = []
    for (let otherRelation of persBRelation) {
        for (let myRelation of persARelation) {
            if (otherRelation.issueA == myRelation.issueA && otherRelation.issueB == myRelation.issueB) {
                let match: number[] = [otherRelation.rel, myRelation.rel];
                matches.push(match);
                break;
            }
        }
    }
    return matches.filter(x => x[0] != -1 && x[1] != -1)
}

/**
 * This function calculates the kappa based on the numbers
 * Throws an error, if the input doesn't match the correct form.
 * 
 * @param matches The matches (list of relation numbers) in list of documents
 */
function calcKappa(matches: number[][]): void {
    if (matches.length == 0 || matches.map(m => m.length).filter(m => m != 2).length > 0)
        throw new Error("wrong array shape should be 2D with 2 cols and multiple rows")
    let classes: number = 4,
        m: number[][] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        agreement: number = 0,
        total: number = 0,
        personAclasses: number[] = [0, 0, 0, 0],
        personBclasses: number[] = [0, 0, 0, 0];

    for (let match of matches) {
        let m0: number = match[0],
            m1: number = match[1];
        if (m0 == -1 || m1 == -1)    //one of the votes is invalid
            continue;
        if (m0 == m1)    //both votes are the same
            agreement++;
        personAclasses[m0]++;
        personBclasses[m1]++;
        total++;                     //total <= relations.length because of invalids
        m[m0][m1]++;
    }
    agreement /= total;
    let p_e: number = calculatePE(classes, [personAclasses, personBclasses], total);
    console.info(`\n\ntotal: ${total}\tagreement: ${agreement}\nkappa: ${(agreement - p_e) / (1 - p_e)}\tfor ${total} issues`)
    console.info(`<=> : ${personAclasses[0]}\t<dupl.> : ${personAclasses[1]}\t=> : ${personAclasses[2]}\t<= :${personAclasses[3]}\t`)
}

/**
 * This function calculates the p_e value of the kappa
 * @param classes number of classes
 * @param personClasses classes for both participants
 * @param total total amount of issues
 * @returns p_e
 */
function calculatePE(classes: number, personClasses: number[][], total: number): number {
    if(classes < 1) throw new Error("No class provided - There has to be at least one class")
    let p_e: number = 0
    for (let c = 0; c < classes; c++) {
        p_e = (personClasses[0][c] / total) * (personClasses[1][c] / total);
    }
    return p_e;
}

// after the files have been opened calculate the kappa
Promise.all([getDataFromFile(true), getDataFromFile(false)])
    .then((data) => {
        let fileAdata: string = data[0].toString(),
            fileBdata: string = data[1].toString();

        createRelations(fileAdata, false);      //create the relations
        createRelations(fileBdata, true);
        let matches = matchRelations();
        calcKappa(matches);                      //calculate the kappa
    });