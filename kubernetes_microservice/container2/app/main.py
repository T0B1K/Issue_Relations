#import request/response related libraries
from fastapi import FastAPI, Request
import asyncio
from pydantic import BaseModel
import json

#standard logging imports
from typing import *
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

#import logic.py
import logic

class RequestVec(BaseModel):
    """This class is represents the interface of the json communication objects received.

    Args:
        issueTexts (List[str]): The issues as strings in a list
        vectorisedTexts (list): A list of the features obtained by the universal sentence encoder 
    """
    issueTexts: List[str]
    vectorisedTexts: list


app = FastAPI()

@app.post('/classify_documents')
async def classify_documents(request: RequestVec):
    """This function classifies the documents handed in

    Args:
        request (RequestVec): The issues to be classified

    Returns:
        JSON: The Relationgraph
    """

    issueTexts:List[str] = request.issueTexts
    vectorisedData:list = request.vectorisedTexts

    response = logic.classify(issueTexts, vectorisedData)
    return response