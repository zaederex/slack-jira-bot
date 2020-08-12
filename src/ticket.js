const axios = require('axios');
const debug = require('debug')('slash-command-template:ticket');
const qs = require('querystring');
const users = require('./users');
var JiraClient = require('jira-connector');
const config = require('./config');
var num = 1;
// Initialize
var jira = new JiraClient( {
    host: config.SLACK_HOST,
    basic_auth: {
        username: config.SLACK_USERNAME,
        password: config.SLACK_PASSWORD
    }
});


function createIssueInJira(jira, ticket) {

	  if(ticket.type === '10000'){
		  num++;
		  return new Promise((resolve, reject) => {
        jira.issue.createIssue({
            fields: {
				project: { key: ticket.key }, 
				summary: ticket.title, 
				issuetype: { id: ticket.type }, 
				priority: { id: ticket.priority }, 
				description: ticket.description,
				reporter: { name: ticket.name },
				customfield_10003: ticket.epic
        } 
		});
      }).catch((err) => { 
    debug('sendConfirmation error: %o', err);
    console.error(err);
		});
	  }
	  else {
      return new Promise((resolve, reject) => {
        jira.issue.createIssue({
            fields: {
				project: { key: ticket.key }, 
				summary: ticket.title, 
				issuetype: { id: ticket.type }, 
				priority: { id: ticket.priority }, 
				description: ticket.description,
				reporter: { name: ticket.name }
        } 
		});
      }).catch((err) => {
    debug('sendConfirmation error: %o', err);
    console.error(err);
		});
	}
};
	
/*
 *  Send ticket creation confirmation via
 *  chat.postMessage to the user who created it
 */
const sendConfirmation = (ticket) => {

  axios.post('https://slack.com/api/chat.postMessage', qs.stringify({
    token: config.SLACK_ACCESS_TOKEN,
    channel: ticket.userId,
    text: 'JIRA ticket created!',
    attachments: JSON.stringify([
      {
        title: `Ticket created by ${ticket.userEmail}`,

        title_link: 'https://npspublicsafetyjira.atlassian.net',
        text: ticket.text,
        fields: [
		  {
            title: 'Key',
            value: ticket.key,
          },
          {
            title: 'Title',
            value: ticket.title,
          },
		  {
            title: 'Type',
            value: ticket.type,
          },
		  {
            title: 'Description',
            value: ticket.description || 'None provided',
          },
		  {
            title: 'priority',
            value: ticket.priority,
			short: true,
          },
		  {
            title: 'Reporter',
            value: ticket.name,
          },

        ],
      },
    ]),
  })).then((result) => {
    debug('sendConfirmation: %o', result.data);
  }).catch((err) => {
    debug('sendConfirmation error: %o', err);
    console.error(err);
  });
};

// Create JIRA ticket. Call users.find to get the user's email address
// from their user ID
const create = (userId, submission,name) => {
  const ticket = {};

  const fetchUserEmail = new Promise((resolve, reject) => {
    users.find(userId).then((result) => {
      debug(`Find user: ${userId}`);
      resolve(result.data.user.profile.email);
    }).catch((err) => { reject(err); });
  });

  fetchUserEmail.then((result) => {
    ticket.userId = userId;
	ticket.name = name;
    ticket.userEmail = result;
	ticket.key = submission.key;
    ticket.title = submission.title;
    ticket.description = submission.description;
    ticket.type = submission.type;
	ticket.priority = submission.priority;
	// ticket.reporter = submission.reporter;
	ticket.epic = ticket.key.concat('-',num);
	createIssueInJira(jira,ticket);

	sendConfirmation(ticket);

    return ticket;
  }).catch((err) => { console.error(err); });
};

module.exports = { create, sendConfirmation };