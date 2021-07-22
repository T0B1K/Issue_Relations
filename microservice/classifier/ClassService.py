from flask import Flask, request
import json
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)
from typing import *
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import keras.backend as K

import numpy

app = Flask(__name__)
model = None

@app.route('/return_message')
def return_message():
    return 'the message'

@app.route('/return_post_message',methods = ['POST', 'GET'])
def return_post_message():
    jsonText = request.json
    logging.info(f"received: {jsonText}")
    txt = jsonText["somekey"]
    return f"received {txt}"



@app.route('/classify_documents',methods = ['POST'])
def classify_documents():
    jsonText = request.json

    issueTexts:List[str] = jsonText["issueTexts"]
    vectorisedData:list = jsonText["vectorisedTexts"]

    response = classify(issueTexts, vectorisedData)
    return response


def classify(issueTexts:List[str], vectorisedData:list)-> str:
    """This function classifies the issueTexts provided given the vectorisedData and creates a JSON response

    Args:
        issueTexts (List[str]): The issues, which are classified
        vectorisedData (list): The vectorised issues

    Returns:
        str: The JSON response {'"issueTexts':List[str], 'relations':[ {"issueA":int ,"issueB":int ,"relation": int },... ]}
    """
    idxList:list = create_adjacency_matrix_entries(len(vectorisedData))

    left_issues:numpy.ndarray = mapIndexToIssue(vectorisedData, idxList, True)
    right_issues:numpy.ndarray = mapIndexToIssue(vectorisedData, idxList, False)
    logging.info(f"issues.shape = {left_issues.shape},{right_issues.shape}")

    classResults = model.predict([left_issues,right_issues], batch_size=15)
    logging.warning(f"classifier results type: {type(classResults)}")
    logging.info(f"classifier results: {classResults}")

    classResults:list = list(map(numpy.argmax, classResults))
    logging.info(classResults)

    response:str = create_response(issueTexts, classResults, idxList)
    return response

def create_response(issueTexts:List[str], classResults:List[int], adjacencyIdxList: list)->str:
    """This funciton creates a JSON response consisting out of the issueTexts, as well as a list of the relations between the issues (given their index)

    Args:
        issueTexts (List[str]): The issue texts
        classResults (List[int]): The classes to the issue pairs
        adjacencyIdxList (list): The issue (index) pairs

    Returns:
        str: The JSON response {'"issueTexts':List[str], 'relations':[ {"issueA":int ,"issueB":int ,"relation": int },... ]}
    """
    relations:list = []
    for issues, relation in zip(adjacencyIdxList, classResults):
      issueA, issueB = issues
      rel:dict = {"issueA":issueA ,"issueB":issueB ,"relation": int(relation)}
      relations.append(rel)

    responseJSON:dict = {"issueTexts":issueTexts, "relations":relations}
    logging.info(f"response: {responseJSON}")
    return json.dumps(responseJSON)

def mapIndexToIssue(vectorisedData:list, idxList:list, leftPart: bool)->numpy.ndarray:
    """This function maps the indexes of the left or right part of the tuple to the vectorised issue vector

    Args:
        vectorisedData (list): This is a list of the vectorised issues
        idxList (list): This are the indexes of the adjacency_matrix
        leftPart (boolean): Whether the left Left or part of the tuple should be chosen 

    Returns:
        numpy.ndarray: [description]
    """
    i:int = 0
    if not leftPart:
        i = 1
    return numpy.array(list(map(lambda idx: vectorisedData[idx[i]],  idxList)))

def create_adjacency_matrix_entries(nrElements:int)->list:
    """This function creates a list consisting out of the index tuples/pairs of the upper triangle of an adjacency matrix of the size nrElements^2.

    Args:
        nrElements (int): The number of elements in the (N x N) adjacency matrix

    Returns:
        list: List of adjacency matrix index tuples.
    """
    elements:int = nrElements-1
    idxList = []
    for i1 in range(elements):
      for i2 in range(elements-i1):
        sndIdx:int = i2+1+i1        #second index + offset
        idxList.append((i1,sndIdx))
    logging.info(f"adjacency-idx-list: {idxList}")
    return idxList


if __name__ == '__main__':
    model = keras.models.load_model('./model')
    model.summary()
    app.run(host='0.0.0.0')

