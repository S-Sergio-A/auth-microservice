FROM node:22-alpine

# Install Ansible
RUN apk update && \
    apk add --no-cache \
    bash

WORKDIR /app
COPY . .

ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc

RUN npm i
RUN npm i @nestjs/cli -g

RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start:prod"]
