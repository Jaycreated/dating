# Mobile App IAP Integration Guide

## Backend API Endpoint

**URL:** `POST /api/payments/verify-iap`
**Headers:** 
- `Authorization: Bearer {user_token}`
- `Content-Type: application/json`

## Request Format

### iOS Request
```typescript
{
  "platform": "ios",
  "productId": "com.pairfect.monthly",
  "receipt": {
    "transactionId": "1000000123456789",
    "receipt": "MIIFpgYJKoZIhvcNAQcCoIIFmDCCBZQC...",
    "productId": "com.pairfect.monthly",
    "isIOS": true,
    "isAndroid": false
  }
}
```

### Android Request
```typescript
{
  "platform": "android",
  "productId": "com.pairfect.monthly",
  "receipt": {
    "originalJson": "{\"packageName\":\"com.anonymous.Pairfect\",\"productId\":\"com.pairfect.monthly\",...}",
    "signature": "MEUCIQDxLjCyQkJI...",
    "purchaseToken": "glkadfjsd...",
    "productId": "com.pairfect.monthly",
    "isIOS": false,
    "isAndroid": true
  }
}
```

## Response Format

### Success
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123456789",
    "userId": "user_123",
    "planId": "monthly",
    "status": "active",
    "startDate": "2024-01-21T00:00:00Z",
    "endDate": "2024-02-21T00:00:00Z",
    "paymentReference": "purchase_token_or_transaction_id",
    "amount": 1000,
    "currency": "USD"
  },
  "message": "Subscription verified and activated successfully"
}
```

### Error
```json
{
  "success": false,
  "message": "Invalid receipt: receipt has expired"
}
```

## React Native Implementation

### 1. Install Dependencies
```bash
npm install react-native-iap
```

### 2. Purchase Flow
```typescript
import RNIap, {
  initConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getProducts,
  requestPurchase,
  requestSubscription,
  validateReceiptAndroid,
  validateReceiptIos,
} from 'react-native-iap';

// Initialize IAP
await initConnection();

// Get products
const products = await getProducts(['com.pairfect.monthly', 'com.pairfect.daily']);

// Purchase subscription
const purchase = await requestSubscription('com.pairfect.monthly');

// Verify with your backend
const response = await fetch('https://your-backend.com/api/payments/verify-iap', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    platform: Platform.OS,
    productId: purchase.productId,
    receipt: purchase,
  }),
});

const result = await response.json();

if (result.success) {
  // Purchase verified! Grant access to premium features
  await finishTransaction(purchase, true);
} else {
  // Verification failed
  await finishTransaction(purchase, false);
}
```

### 3. Product IDs
```typescript
const PRODUCT_IDS = {
  ios: {
    monthly: 'com.pairfect.monthly',
    daily: 'com.pairfect.daily',
  },
  android: {
    monthly: 'com.pairfect.monthly',
    daily: 'com.pairfect.daily',
  },
};
```

## Testing

### iOS Sandbox
- Use sandbox Apple ID
- Test receipts will be from sandbox environment
- Backend automatically detects sandbox vs production

### Android Testing
- Use Google Play's test accounts
- Add your app to Google Play Console for testing
- Real purchases in testing mode

## Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| "Invalid receipt" | Check receipt format, ensure not expired |
| "Platform not configured" | Verify backend env vars are set |
| "Invalid product ID" | Ensure product IDs match exactly |
| "Network error" | Add retry logic, check internet connection |

## Security Notes

- Always verify receipts on backend (never trust client)
- Store user token securely
- Use HTTPS in production
- Handle purchase states (pending, purchased, expired)
