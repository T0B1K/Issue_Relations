const URL = require('url');
import { promises as fs } from 'fs';

export enum Relation {
    right,
    left,
    both,
    duplicate
}

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

export interface DataNodeObject {
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
export class DataNode implements DataNodeObject {
    id: string;
    issueID: number;
    repository: string;
    user: string;
    title: string;
    body: string;
    comments: Comment[];
    url: string;

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