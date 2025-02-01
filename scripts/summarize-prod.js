require('dotenv').config({ path: '.env.production' });
const { execSync } = require('child_process');

// Parse command line arguments with defaults
const args = process.argv.slice(2);
const defaults = {
  numStories: 10,
  numCommentsPerStory: 20,
  maxSummaryLength: 300,
};

function printUsage() {
  console.log(`
Usage: node summarize-prod.js [numStories] [numCommentsPerStory] [maxSummaryLength]
  numStories          - Number of stories to fetch (default: ${defaults.numStories})
  numCommentsPerStory - Number of comments per story (default: ${defaults.numCommentsPerStory})
  maxSummaryLength    - Maximum length of summaries (default: ${defaults.maxSummaryLength})

Example: node summarize-prod.js 5 10 200
`);
}

// Show help if --help or -h is passed
if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

const numStories = parseInt(args[0]) || defaults.numStories;
const numCommentsPerStory = parseInt(args[1]) || defaults.numCommentsPerStory;
const maxSummaryLength = parseInt(args[2]) || defaults.maxSummaryLength;

const apiUrl = process.env.API_URL;
const apiKey = process.env.API_KEY;

console.log('Configuration:');
console.log('- API URL:', apiUrl);
console.log('- API Key:', apiKey ? '****' + apiKey.slice(-4) : 'not set');
console.log('- Number of Stories:', numStories);
console.log('- Comments per Story:', numCommentsPerStory);
console.log('- Max Summary Length:', maxSummaryLength);
console.log();

if (!apiUrl || !apiKey) {
  console.error('Error: API_URL and API_KEY must be set in .env.production');
  process.exit(1);
}

const command = `curl -X POST "${apiUrl}/api/v1/hacker-news/summarized-stories" \
  -H 'Content-Type: application/json' \
  -H "x-api-key: ${apiKey}" \
  -d '{"numStories": ${numStories}, "numCommentsPerStory": ${numCommentsPerStory}, "maxSummaryLength": ${maxSummaryLength}}'`;

console.log('\nExecuting command:', command);

try {
  const output = execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error('Error executing curl command:', error.message);
  process.exit(1);
}
