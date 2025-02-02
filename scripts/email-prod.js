#!/usr/bin/env node

const dotenv = require('dotenv');
const path = require('path');
const { Command } = require('commander');
const axios = require('axios');

// Load production environment variables
dotenv.config({ path: path.join(__dirname, '../.env.production') });

const program = new Command();

program
  .option('-e, --email <email>', 'Email address to send to')
  .option('-s, --stories <number>', 'Number of stories', '10')
  .option('-c, --comments <number>', 'Number of comments per story', '20')
  .option('-l, --length <number>', 'Max summary length', '300')
  .option('-v, --verbose', 'Show detailed error information')
  .parse();

const options = program.opts();

// Use provided email or default from env
const email = options.email || process.env.TEST_EMAIL_RECIPIENTS;

if (!email) {
  console.error(
    'Error: Email address is required. Use --email option or set TEST_EMAIL_RECIPIENTS in .env.production',
  );
  process.exit(1);
}

const config = {
  apiUrl: process.env.API_URL,
  apiKey: process.env.API_KEY,
  email: email,
  numStories: parseInt(options.stories),
  numCommentsPerStory: parseInt(options.comments),
  maxSummaryLength: parseInt(options.length),
};

console.log('Configuration:');
console.log(`- API URL: ${config.apiUrl}`);
console.log(
  `- API Key: ${config.apiKey ? config.apiKey.slice(0, 4) + '****' + config.apiKey.slice(-4) : 'NOT SET'}`,
);
console.log(`- Email: ${config.email}`);
console.log(`- Number of Stories: ${config.numStories}`);
console.log(`- Comments per Story: ${config.numCommentsPerStory}`);
console.log(`- Max Summary Length: ${config.maxSummaryLength}`);
console.log('\n');

async function sendRequest() {
  try {
    const response = await axios({
      method: 'post',
      url: `${config.apiUrl}hacker-news/newsletter`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
      },
      data: {
        emails: [config.email],
        numStories: config.numStories,
        numCommentsPerStory: config.numCommentsPerStory,
        maxSummaryLength: config.maxSummaryLength,
      },
    });

    console.log('Success! Email request sent.');
    if (options.verbose) {
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error sending email request:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
      console.error(error.message);
    } else {
      console.error('Error:', error.message);
    }
    if (options.verbose) {
      console.error('Full error:', error);
    }
    process.exit(1);
  }
}

sendRequest();
