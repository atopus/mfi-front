FROM node

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH
ENV REACT_APP_API_HOST=localhost
ENV REACT_APP_API_PORT=8080

COPY . ./

RUN npm install --silent
RUN npm install react-script -g --silent

RUN npm run build

COPY build .