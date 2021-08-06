#for the communication
from fastapi import FastAPI, Request
import httpx
import asyncio
from pydantic import BaseModel
import json
#standard logging
from typing import *
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)
#import of the logic.py file
import logic

CLASSIFY_SERVICE_HOSTNAME:str = "container2"
CLASSIFY_SERVICE_PORT:str = "8080"


class RequestMSG(BaseModel):
    """The basic request should look like this

    Args:
        issueTexts (List[str]): A list of (string) issues.
    """
    issueTexts: List[str]

async def postTask(url:str, jsonMessage):
    """This funciton is used to create post requests to the URL
    provided with the message provided

    Args:
        url (str): The url of the other service
        jsonMessage (RequestVec): The message to be sent

    Returns:
        JSON: The data send back after the request
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=jsonMessage, timeout=None)
        logging.info(response)
        logging.info("received response")
        return response


app = FastAPI()  


@app.post("/vectorise_issues")
async def vectorise_issues(request: RequestMSG):
    """This method receives a JSON containing issues and returns a JSON with the issues and their vectorised forms 

    Returns:
        str: JSON response
    """
    logging.info("received data")

    issueTexts: List[str] = request.issueTexts
    logging.info(issueTexts)
    
    response:dict = logic.vectorise(issueTexts)
    logging.info("finished vectorising")
    return json.dumps(response)


@app.post("/vectorise_and_classify_issues")
async def vectorise_and_classify_issues(request: RequestMSG):
    """This method receives a JSON containing issues and returns a JSON with the issues and their vectorised forms 

    Returns:
        str: JSON response
    """
    
    logging.info("received data")

    issueTexts: List[str] = request.issueTexts
    
    response = logic.vectorise(issueTexts)
    logging.info("creating request")
    classifyURL: str = constructClassifyServiceURL("classify_documents")

    text = await postTask(classifyURL, response)
    return text.json()

def constructClassifyServiceURL(path: str) -> str:
    """This method constructs the URL for accessing the classification service given a path

    Args:
        path (str): The path for the classification service

    Returns:
        str: Constructed URL
    """
    global CLASSIFY_SERVICE_HOSTNAME, CLASSIFY_SERVICE_PORT
    return f"http://{CLASSIFY_SERVICE_HOSTNAME}:{CLASSIFY_SERVICE_PORT}/{path}"
