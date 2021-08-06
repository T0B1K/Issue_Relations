import tensorflow_hub as hub
import tensorflow as tf

from typing import *
import logging

logging.info("Loading sentence encoder")
#"https://tfhub.dev/google/universal-sentence-encoder/4"
google_sentence_encoder = hub.load("./universal-sentence-encoder_4")
logging.info('Finished loading sentence encoder')

def vectorise(issueTexts: List[str])-> dict:
    """This method handles the construction of the response as well as the vecorisation of the strings given a list of strings

    Args:
        issueTexts (List[str]): A list of strings (issue texts)

    Returns:
        [type]: The constructed JSON response.
    """
    logging.info("vectorising issues")
    vectorisedIssues:list = vectoriseIssues(issueTexts)
    logging.info("vectorised issues")
    response = constructResponse(issueTexts, vectorisedIssues)
    return response

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
    return responseJSON