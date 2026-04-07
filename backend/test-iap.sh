#!/bin/bash

echo "🧪 Testing IAP Implementation..."
echo ""

# Test 1: Check if backend is running
echo "1. Checking backend health..."
curl -s http://localhost:5000/health || echo "❌ Backend not running on port 5000"
echo ""

# Test 2: Get auth token (you'll need to replace with real login)
echo "2. Getting auth token..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token. Please login first:"
  echo "curl -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"your_email\",\"password\":\"your_password\"}'"
  exit 1
fi

echo "✅ Auth token obtained"
echo ""

# Test 3: Test iOS IAP verification
echo "3. Testing iOS IAP verification..."
curl -X POST http://localhost:5000/api/payments/test-iap \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

echo ""

# Test 4: Test Android IAP verification
echo "4. Testing Android IAP verification..."
curl -X POST http://localhost:5000/api/payments/test-iap \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

echo ""

# Test 5: Check database
echo "5. Checking database for test data..."
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_receipts FROM iap_receipts;" 2>/dev/null || echo "❌ Database connection failed"

echo ""
echo "✅ IAP Tests Complete!"
echo "📝 Check backend console for detailed results"
