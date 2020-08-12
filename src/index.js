require('dotenv').config();

const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const qs = require('querystring');
const ticket = require('./ticket');
const debug = require('debug')('slash-command-template:index');
const config = require('./config');

const app = express();

/*
 * Parse application/x-www-form-urlencoded && application/json
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('<h2>The Slash Command and Dialog app is running</h2> <p>Follow the' +
  ' instructions in the README to configure the Slack App and your environment variables.</p>');
});

/*
 * Endpoint to receive slash command from Slack.
 * Checks verification token and opens a dialog to capture more info.
 */
app.post('/commands', (req, res) => {
  // extract the verification token, slash command text,
  // and trigger ID from payload
  const { token, text, trigger_id } = req.body;
  // check that the verification token matches expected value
  if (token === config.SLACK_VERIFICATION_TOKEN) {
    // create the dialog payload - includes the dialog structure, Slack API token,
    // and trigger ID

    const dialog = {
      token: config.SLACK_ACCESS_TOKEN, 
      trigger_id,
      dialog: JSON.stringify({
        title: 'Raise a JIRA ticket', 
        callback_id: 'submit-ticket',
        submit_label: 'Submit',
        elements: [
		  {
            label: 'Project key',
            type: 'text',
            name: 'key',
            value: text,
            hint: 'Key associated with the Project e.g. DEV',
          },
          {
            label: 'Summary',
            type: 'text',
            name: 'title',
            value: text,
            hint: 'Name of the Ticket',
          },
		  {
            label: 'Issue Type',
            type: 'select',
            name: 'type',
            options: [
			  { label: 'Task', value: '10002' },
              { label: 'Enhancement', value: '10007' },
              { label: 'Documentation', value: '10600' },
              { label: 'Bug', value: '10004' },
			  { label: 'New Feature', value: '10009' },
			  { label: 'Epic', value: '10000' },
			  { label: 'Story', value: '10001' },
            ],
          },
          {
            label: 'Description',
            type: 'textarea',
            name: 'description',
            optional: true,
          },
          {
            label: 'Priority',
            type: 'select',
            name: 'priority',
            options: [
              { label: 'P1', value: '10003' },
              { label: 'P2', value: '10004' },
              { label: 'P3', value: '10000' },
			  { label: 'P4', value: '10001' },
			  { label: 'P5', value: '10002' },
			  { label: 'TBC', value: '10214' },
			  { label: '1', value: '10225' },
			  { label: '2', value: '10226' },
			  { label: '3', value: '10227' },
			  { label: '4', value: '10228' },
			  { label: '5', value: '10229' },
			  { label: '6', value: '10230' },
			  { label: '7', value: '10231' },
			  { label: '8', value: '10232' },
			  { label: '9', value: '10233' },
            ],
          },
		/* {
            label: 'Reporter',
            type: 'text',
            name: 'reporter',
            value: text,
            hint: 'Name of the Reporter',
			optional: false,
          }, */
        ],
      }),
    };

    // open the dialog by calling dialogs.open method and sending the payload
    axios.post('https://slack.com/api/dialog.open', qs.stringify(dialog))
      .then((result) => {

        res.send('');
      }).catch((err) => {

        res.sendStatus(500);
      });
  } else {
    console.log('Verification token mismatch');
    res.sendStatus(500);
  }
});

/*
 * Endpoint to receive the dialog submission. Checks the verification token
 * and creates a ticket
 */
app.post('/interactive-component', (req, res) => {
  const body = JSON.parse(req.body.payload);

  // check that the verification token matches expected value
  if (body.token === config.SLACK_VERIFICATION_TOKEN) {
    debug(`Form submission received: ${body.submission.trigger_id}`);

    // immediately respond with a empty 200 response to let
    // Slack know the command was received
    res.send('');

    // create JIRA ticket
    ticket.create(body.user.id, body.submission, body.user.name);

  } else {
    debug('Token mismatch');
    res.sendStatus(500);
  }
});

app.listen(config.PORT, () => {
  console.log(`App listening on port ${config.PORT}!`);
});
