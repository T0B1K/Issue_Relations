import json
import tensorflow_hub as hub
import tensorflow as tf
from typing import *
from flask import Flask, request
import requests
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

CLASSIFY_SERVICE_HOSTNAME: str = "classifier"
CLASSIFY_SERVICE_PORT: str = "5000"
GOOGLE_SE_URL = "https://tfhub.dev/google/universal-sentence-encoder/4"
google_sentence_encoder = None

app = Flask(__name__)


@app.route('/get_message')
def get_message():
    url: str = constructClassifyServiceURL("return_message")
    message = requests.get(url)
    return message.text


@app.route("/post_message")
def post_message():
    url: str = constructClassifyServiceURL("return_post_message")
    myobj = {'somekey': 'somevalue'}
    text = requests.post(url, json=myobj)
    return text.text


@app.route("/vectorise_issues", methods=['POST'])
def vectorise_issues():
    """This method receives a JSON containing issues and returns a JSON with the issues and their vectorised forms 

    Returns:
        str: JSON response
    """
    logging.info("received data")
    requestJSON = request.json
    issueTexts: List[str] = requestJSON["issueTexts"]
    response:dict = vectorise(issueTexts)

    return json.dumps(response)


@app.route("/vectorise_and_classify_issues", methods=['POST'])
def vectorise_and_classify_issues():
    """This method receives a JSON containing issues and returns a JSON with the issues and their vectorised forms 

    Returns:
        str: JSON response
    """
    logging.info("received data")
    requestJSON = request.json
    issueTexts: List[str] = requestJSON["issueTexts"]
    response = vectorise(issueTexts)

    classifyURL: str = constructClassifyServiceURL("classify_documents")
    text:dict = requests.post(classifyURL, json=response)

    return text.text


def getGoogleSentenceEncoder():
    """This method loads the google sentence encoder
    """
    global google_sentence_encoder, GOOGLE_SE_URL
    if google_sentence_encoder is None:
        logging.info("Downloading sentence encoder")
        google_sentence_encoder = hub.load(GOOGLE_SE_URL)
        logging.info('Finished downloading sentence encoder')


def vectorise(issueTexts: List[str])-> dict:
    """This method handles the construction of the response as well as the vecorisation of the strings given a list of strings

    Args:
        issueTexts (List[str]): A list of strings (issue texts)

    Returns:
        [type]: The constructed JSON response.
    """
    logging.info(f"vectorising issues")
    vectorisedIssues:list = vectoriseIssues(issueTexts)
    response = constructResponse(issueTexts, vectorisedIssues)
    return response


def constructClassifyServiceURL(path: str) -> str:
    """This method constructs the URL for accessing the classification service given a path

    Args:
        path (str): The path for the classification service

    Returns:
        str: Constructed URL
    """
    global CLASSIFY_SERVICE_HOSTNAME, CLASSIFY_SERVICE_PORT
    return f"http://{CLASSIFY_SERVICE_HOSTNAME}:{CLASSIFY_SERVICE_PORT}/{path}"


def vectoriseIssues(issueList: List[str]) -> list:
    """This function creates a vector representation out of a list of issues (strings).

    Args:
        issueList (List[str]): The issues to be vectorised

    Returns:
        list: The vector representation of the issues
    """
    vectorisedDocuments = google_sentence_encoder(issueList)
    return tensorToList(vectorisedDocuments)


def tensorToList(tfArray) -> list:
    """This method converts a tensofrlow tensor to a list for serialisation purposes

    Args:
        tfArray (EagerTensor): The tensorflow array

    Returns:
        list: The converted list
    """
    return tfArray.numpy().tolist()


def constructResponse(issueTexts: List[str], vectorisedList: list):
    """This method returns a JSON consisting out of the issue texts and the vectorised issues provided.

    Args:
        issueTexts (List[str]): The issues, which were vectorised
        vectorisedList (list): The vectorised data itself

    Returns:
        JSON: JSON response
    """
    responseJSON = {
        "issueTexts": issueTexts,
        "vectorisedTexts": vectorisedList
    }
    logging.info(f"type of responseJSON: {type(responseJSON)}")
    return responseJSON


if __name__ == '__main__':
    getGoogleSentenceEncoder()
    app.run(host='0.0.0.0')