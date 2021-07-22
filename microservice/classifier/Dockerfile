# syntax=docker/dockerfile:1

FROM python:3.8-slim-buster

WORKDIR /ClassService

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

RUN tar -xvzf model.tar.gz

CMD [ "python", "ClassService.py"]
