# syntax=docker/dockerfile:1

FROM python:3.8-slim-buster

WORKDIR /VecService

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
RUN pip3 install --upgrade tensorflow-hub

COPY . .

CMD [ "python", "VecService.py"]
