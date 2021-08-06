# syntax=docker/dockerfile:1

FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8-2021-06-09


COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

RUN pip3 install --upgrade tensorflow-hub

COPY ./app /app
WORKDIR /app

RUN mkdir /app/universal-sentence-encoder_4
RUN tar -xvzf universal-sentence-encoder_4.tar.gz -C /app/universal-sentence-encoder_4 && rm universal-sentence-encoder_4.tar.gz

ENV MAX_WORKERS 1
ENV TIMEOUT 1200
ENV KEEP_ALIVE 20
ENV GRACEFUL_TIMEOUT 1200