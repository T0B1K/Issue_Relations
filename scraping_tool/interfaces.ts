const URL = require('url');
import { promises as fs } from 'fs';

export enum Relation {
    right,  //causes
    left,   //is caused by
    both,   //undefined relation
    duplicate
}

/**
 * This interface is used for documenting the relations between two issues
 */
export interface IssueRelation {
    urlIssueA: string;
    urlIssueB: string;
    relation: Relation;
    dateMentioned: Date
}

/**
 * An issue can have several comments
 */
export interface Comment {
    createdAt: Date;
    updatedAt: Date;
    body: string;
}

/**
 * Through this interface issues are created
 */
export interface IssueInterface {
    id: string;
    issueID: number;
    repository: string;
    user: string;
    title: string;
    body: string;
    comments: Comment[];
    url: string;
}

/**
 * This class is the class for the nodes 
 */
export class DataNode implements IssueInterface {
    id: string;
    issueID: number;
    repository: string;
    user: string;
    title: string;
    body: string;
    comments: Comment[];
    url: string;

    /**
     * This is the constructor of the Data Node class
     * and Creates a Data Node given a url string
     * @param url this is the URL of the issue
     */
    constructor(url: string) {
        this.url = url;
        let parsedURL: any = URL.parse(url, true);
        let pathname: string[] = parsedURL.pathname.split("/");
        this.user = pathname[1];
        this.repository = pathname[2];
        this.issueID = parseInt(pathname[4]);
        this.title = "";
        this.body = "";
        this.id = `${this.user}_${this.repository}#${this.issueID}`
    }
}


/**
 * This function opens a file and returns its content
 * 
 * @param filename The filename of the file to be opened
 * @returns A promissed buffer of the file content
 */
 export async function getDataFromFile(filename: string): Promise<Buffer> {
    let data = await fs.readFile(filename, "utf8");
    return Buffer.from(data);
  }
  
  /**
   * This function writes the content into a file
   * 
   * @param content The content to be written into the file
   * @param filename The filename of the file
   */
   export async function writeToFile(content: string, filename: string) {
    try {
      fs.writeFile(filename, content, { flag: 'w+' })
    } catch (err) {
      console.error(err)
    }
  }