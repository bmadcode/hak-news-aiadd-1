#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Base URL and headers
BASE_URL="http://localhost:3000/subscriptions"
HEADERS=(-H "Content-Type: application/json" -H "x-api-key: test-key")

echo "🚀 Testing Subscription Endpoints"
echo "--------------------------------"

# Test 1: Subscribe new email
echo -e "\n${GREEN}Test 1: Subscribe new email${NC}"
curl -X POST "${BASE_URL}" \
  "${HEADERS[@]}" \
  -d '{"email": "test@example.com", "subscriptionType": "hakdaily"}'

# Test 2: Try to subscribe same email (should fail with 409)
echo -e "\n\n${GREEN}Test 2: Try to subscribe same email${NC}"
curl -X POST "${BASE_URL}" \
  "${HEADERS[@]}" \
  -d '{"email": "test@example.com", "subscriptionType": "hakdaily"}'

# Test 3: Get all subscribers
echo -e "\n\n${GREEN}Test 3: Get all subscribers${NC}"
curl "${BASE_URL}/hakdaily" \
  "${HEADERS[@]}"

# Test 4: Unsubscribe email
echo -e "\n\n${GREEN}Test 4: Unsubscribe email${NC}"
curl -X DELETE "${BASE_URL}" \
  "${HEADERS[@]}" \
  -d '{"email": "test@example.com", "subscriptionType": "hakdaily"}'

# Test 5: Verify unsubscribed by getting subscribers (should be empty)
echo -e "\n\n${GREEN}Test 5: Verify unsubscribed${NC}"
curl "${BASE_URL}/hakdaily" \
  "${HEADERS[@]}"

echo -e "\n\n${GREEN}Tests completed!${NC}" 