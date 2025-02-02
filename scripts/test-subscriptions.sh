#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Base URL for subscription endpoints
BASE_URL="http://localhost:3000/subscriptions"

# Headers for API requests
HEADERS=(
  -H "Content-Type: application/json"
  -H "x-api-key: 6L9r2oIddC7vSwOOm198PzINVIWGf9T1gmF7WUQe"
)

echo -e "${GREEN}🚀 Testing Subscription Endpoints${NC}"
echo "--------------------------------"

# Test 1: Subscribe new email
echo -e "\nTest 1: Subscribe new email"
curl "${HEADERS[@]}" -X POST -d '{"email":"test@example.com","subscriptionType":"hakdaily"}' $BASE_URL

# Test 2: Try to subscribe same email (should fail with 409)
echo -e "\n\nTest 2: Try to subscribe same email"
curl "${HEADERS[@]}" -X POST -d '{"email":"test@example.com","subscriptionType":"hakdaily"}' $BASE_URL

# Test 3: Get all subscribers
echo -e "\n\nTest 3: Get all subscribers"
curl "${HEADERS[@]}" -X GET "$BASE_URL/hakdaily"

# Test 4: Unsubscribe email
echo -e "\n\nTest 4: Unsubscribe email"
curl "${HEADERS[@]}" -X DELETE -d '{"email":"test@example.com","subscriptionType":"hakdaily"}' $BASE_URL

# Test 5: Verify unsubscribed
echo -e "\n\nTest 5: Verify unsubscribed"
curl "${HEADERS[@]}" -X GET "$BASE_URL/hakdaily"

echo -e "\n\nTests completed!" 