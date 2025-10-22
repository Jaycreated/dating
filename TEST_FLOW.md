# Complete Flow Test Guide

## Prerequisites

1. ✅ Backend running on `http://localhost:5000`
2. ✅ Frontend running on `http://localhost:3000`
3. ✅ Database connected (Neon PostgreSQL)
4. ✅ Cloudinary credentials configured

## Test Flow

### 1. Registration & Authentication

**Test Registration:**
```bash
# Open browser: http://localhost:3000
# Click "Get Started" or "Sign Up"
# Fill form:
  - Name: Test User
  - Email: test@example.com
  - Password: password123
# Click "Create Account"
```

**Expected Result:**
- ✅ Account created in database
- ✅ JWT token stored in localStorage
- ✅ Redirects to `/complete-profile`

**Backend Check:**
```bash
cd backend
npx ts-node verify-database.ts
# Should show 1+ users in database
```

---

### 2. Step 1: Complete Profile

**Test Basic Info:**
```
# Should be on: /complete-profile
# Fill form:
  - Name: John Doe
  - Age: 25
  - Gender: Male (click the card)
# Click "Continue"
```

**Expected Result:**
- ✅ Profile updated in database
- ✅ Redirects to `/select-interests`

**API Call:**
```
PUT /api/users/profile
Body: { name: "John Doe", age: 25, gender: "male" }
```

---

### 3. Step 2: Select Interests

**Test Interest Selection:**
```
# Should be on: /select-interests
# Click one option:
  - Relationship
  - Casual Friendship
  - Hookup
  - Chat Buddy
# Click "Continue"
```

**Expected Result:**
- ✅ Preferences saved to database
- ✅ Redirects to `/upload-photos`

**API Call:**
```
PUT /api/users/profile
Body: { preferences: { lookingFor: "relationship" } }
```

---

### 4. Step 3: Upload Photos

**Test Photo Upload:**
```
# Should be on: /upload-photos
# Click first upload box
# Select an image (JPG/PNG, < 5MB)
# Wait for upload to complete
# Click second upload box
# Select another image
# Click "Continue"
```

**Expected Result:**
- ✅ Images uploaded to Cloudinary
- ✅ URLs saved to database
- ✅ Redirects to `/dashboard`

**API Call:**
```
PUT /api/users/profile
Body: { photos: ["https://cloudinary.com/...", "https://cloudinary.com/..."] }
```

---

### 5. Login Flow

**Test Login:**
```bash
# Logout (if logged in)
# Go to: http://localhost:3000/login
# Fill form:
  - Email: test@example.com
  - Password: password123
# Click "Sign In"
```

**Expected Result:**
- ✅ JWT token received
- ✅ User data stored in localStorage
- ✅ Redirects to `/dashboard`

**API Call:**
```
POST /api/auth/login
Body: { email: "test@example.com", password: "password123" }
Response: { token: "jwt...", user: {...} }
```

---

## Verification Checklist

### Backend API Endpoints

- ✅ `POST /api/auth/register` - Create account
- ✅ `POST /api/auth/login` - Login
- ✅ `GET /api/auth/me` - Get current user
- ✅ `GET /api/users/profile` - Get profile
- ✅ `PUT /api/users/profile` - Update profile
- ✅ `GET /api/users/potential-matches` - Get matches

### Database Tables

- ✅ `users` table with all columns
- ✅ `matches` table
- ✅ `messages` table
- ✅ Indexes created

### Frontend Pages

- ✅ `/` - Landing page
- ✅ `/register` - Registration
- ✅ `/login` - Login
- ✅ `/complete-profile` - Step 1
- ✅ `/select-interests` - Step 2
- ✅ `/upload-photos` - Step 3
- ✅ `/dashboard` - Main app (to be created)

### Authentication

- ✅ JWT token generation
- ✅ Token stored in localStorage
- ✅ Token sent in Authorization header
- ✅ Protected routes require authentication
- ✅ 401 redirects to login

### Data Flow

- ✅ Registration → Database insert
- ✅ Profile update → Database update
- ✅ Photo upload → Cloudinary → Database
- ✅ Login → Token generation
- ✅ Protected API calls → Token validation

---

## Common Issues & Solutions

### Issue: "Connection timeout"
**Solution:** Check DATABASE_URL in backend/.env

### Issue: "Upload failed"
**Solution:** Verify Cloudinary credentials in frontend/.env.development

### Issue: "401 Unauthorized"
**Solution:** Check if token is in localStorage and valid

### Issue: "CORS error"
**Solution:** Backend should have CORS enabled (already configured)

### Issue: "Photos not uploading"
**Solution:** 
- Check Cloudinary preset is "Unsigned"
- Verify cloud name is correct
- Check browser console for errors

---

## Manual API Testing

### Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test2@example.com",
    "password": "password123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "password123"
  }'
```

### Test Profile Update (with token)
```bash
TOKEN="your_jwt_token_here"

curl -X PUT http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Name",
    "age": 25,
    "gender": "male"
  }'
```

---

## Success Criteria

✅ **Registration Flow:**
- User can register
- Account created in database
- JWT token received

✅ **Onboarding Flow:**
- Step 1: Name, age, gender saved
- Step 2: Interest preference saved
- Step 3: Photos uploaded to Cloudinary and URLs saved

✅ **Login Flow:**
- User can login with credentials
- JWT token received
- Redirects to dashboard

✅ **Data Persistence:**
- All data saved to PostgreSQL
- Photos stored on Cloudinary
- User can logout and login again with same data

---

## Next Steps

After successful testing:
1. Create Dashboard page
2. Implement matching algorithm
3. Add chat functionality
4. Deploy to production
