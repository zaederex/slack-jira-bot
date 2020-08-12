const qs = require('querystring');

const axios = require('axios');

const config = require('./config.js');


const find = (slackUserId) => {

  const body = { token: config.SLACK_ACCESS_TOKEN, user: slackUserId };

  const promise = axios.post('https://slack.com/api/users.info', qs.stringify(body));

  return promise;

};



module.exports = { find };