# syntax=docker/dockerfile:1

FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8-2021-06-09

ENV PORT 8080

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY ./app /app
WORKDIR /app
RUN tar -xvzf model.tar.gz


ENV MAX_WORKERS 1
ENV TIMEOUT 1200
ENV KEEP_ALIVE 20
ENV GRACEFUL_TIMEOUT 1200
