#!/bin/bash

# Load environment variables
source .env.local

# API endpoint
API_URL="http://localhost:3000/hacker-news/newsletter"

# Test data
JSON_DATA='{
  "numStories": 3,
  "numCommentsPerStory": 5,
  "maxSummaryLength": 100,
  "includeOriginalContent": false,
  "emails": ["test@example.com"]
}'

# Make the API call
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d "$JSON_DATA" \
  $API_URL 