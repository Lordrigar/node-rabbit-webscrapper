FROM node:16.0.0-alpine

WORKDIR /usr/src

COPY package.json ./

COPY package-lock.json ./

RUN npm ci

COPY . .