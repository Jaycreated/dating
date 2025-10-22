#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Complete Backend Flow"
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s http://localhost:5000/health)
if [[ $HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Registration
echo "2️⃣  Testing Registration..."
RANDOM_EMAIL="test$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"password123\"
  }")

TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [[ -n "$TOKEN" ]]; then
    echo -e "${GREEN}✅ Registration successful${NC}"
    echo "   Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ Registration failed${NC}"
    echo "   Response: $REGISTER_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Get Current User
echo "3️⃣  Testing Get Current User..."
ME_RESPONSE=$(curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN")

if [[ $ME_RESPONSE == *"$RANDOM_EMAIL"* ]]; then
    echo -e "${GREEN}✅ Get current user successful${NC}"
else
    echo -e "${RED}❌ Get current user failed${NC}"
    echo "   Response: $ME_RESPONSE"
fi
echo ""

# Test 4: Update Profile (Step 1)
echo "4️⃣  Testing Profile Update (Step 1 - Basic Info)..."
UPDATE1_RESPONSE=$(curl -s -X PUT http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "John Doe",
    "age": 25,
    "gender": "male"
  }')

if [[ $UPDATE1_RESPONSE == *"success"* ]]; then
    echo -e "${GREEN}✅ Step 1 profile update successful${NC}"
else
    echo -e "${RED}❌ Step 1 profile update failed${NC}"
    echo "   Response: $UPDATE1_RESPONSE"
fi
echo ""

# Test 5: Update Profile (Step 2)
echo "5️⃣  Testing Profile Update (Step 2 - Interests)..."
UPDATE2_RESPONSE=$(curl -s -X PUT http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "preferences": {"lookingFor": "relationship"}
  }')

if [[ $UPDATE2_RESPONSE == *"success"* ]]; then
    echo -e "${GREEN}✅ Step 2 profile update successful${NC}"
else
    echo -e "${RED}❌ Step 2 profile update failed${NC}"
    echo "   Response: $UPDATE2_RESPONSE"
fi
echo ""

# Test 6: Update Profile (Step 3)
echo "6️⃣  Testing Profile Update (Step 3 - Photos)..."
UPDATE3_RESPONSE=$(curl -s -X PUT http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
  }')

if [[ $UPDATE3_RESPONSE == *"success"* ]]; then
    echo -e "${GREEN}✅ Step 3 profile update successful${NC}"
else
    echo -e "${RED}❌ Step 3 profile update failed${NC}"
    echo "   Response: $UPDATE3_RESPONSE"
fi
echo ""

# Test 7: Get Profile
echo "7️⃣  Testing Get Profile..."
PROFILE_RESPONSE=$(curl -s http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN")

if [[ $PROFILE_RESPONSE == *"John Doe"* ]] && [[ $PROFILE_RESPONSE == *"male"* ]]; then
    echo -e "${GREEN}✅ Get profile successful${NC}"
    echo "   Profile includes updated data"
else
    echo -e "${YELLOW}⚠️  Get profile returned data but may be incomplete${NC}"
    echo "   Response: $PROFILE_RESPONSE"
fi
echo ""

# Test 8: Login
echo "8️⃣  Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"password123\"
  }")

LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [[ -n "$LOGIN_TOKEN" ]]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "   New Token: ${LOGIN_TOKEN:0:20}..."
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "   Response: $LOGIN_RESPONSE"
fi
echo ""

# Summary
echo "================================"
echo -e "${GREEN}🎉 All tests completed!${NC}"
echo ""
echo "Test user created:"
echo "  Email: $RANDOM_EMAIL"
echo "  Password: password123"
echo ""
echo "You can now test the frontend with these credentials!"
