#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:5000"

echo -e "${BLUE}=== Testing Dating API ===${NC}\n"

# 1. Health Check
echo -e "${GREEN}1. Testing Health Check${NC}"
curl -s $API_URL/health | jq .
echo -e "\n"

# 2. Register User
echo -e "${GREEN}2. Registering User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "John Doe"
  }')
echo $REGISTER_RESPONSE | jq .
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
echo -e "Token: $TOKEN\n"

# 3. Login
echo -e "${GREEN}3. Testing Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')
echo $LOGIN_RESPONSE | jq .
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo -e "\n"

# 4. Get Current User
echo -e "${GREEN}4. Getting Current User${NC}"
curl -s -X GET $API_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# 5. Update Profile
echo -e "${GREEN}5. Updating Profile${NC}"
curl -s -X PUT $API_URL/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "age": 25,
    "gender": "male",
    "bio": "Looking for meaningful connections",
    "interests": ["hiking", "reading", "travel"],
    "preferences": {
      "minAge": 22,
      "maxAge": 30,
      "gender": "female"
    }
  }' | jq .
echo -e "\n"

# 6. Get Profile
echo -e "${GREEN}6. Getting Profile${NC}"
curl -s -X GET $API_URL/api/users/profile \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# 7. Get Potential Matches
echo -e "${GREEN}7. Getting Potential Matches${NC}"
curl -s -X GET $API_URL/api/users/potential-matches \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# 8. Get Matches
echo -e "${GREEN}8. Getting Matches${NC}"
curl -s -X GET $API_URL/api/matches \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

echo -e "${BLUE}=== Testing Complete ===${NC}"
