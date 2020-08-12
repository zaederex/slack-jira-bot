FROM node:carbon

# Set app directory
WORKDIR /usr/src/app

#Ensuring package.json and package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle all source files
COPY . .

#Exposing port 3000 and starting the jira dialog app
EXPOSE 3000
CMD [ "npm", "start" ]