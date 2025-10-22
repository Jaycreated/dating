# Dating App Backend API

A RESTful API for a matchmaking/dating application built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- ✅ User authentication (register, login, JWT)
- ✅ User profile management
- ✅ Matchmaking system (like/pass)
- ✅ Mutual match detection
- ✅ Messaging between matched users
- ✅ PostgreSQL database with proper indexing

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure PostgreSQL

Create a PostgreSQL database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE dating_app;

# Exit
\q
```

### 3. Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dating_app
DB_USER=postgres
DB_PASSWORD=your-password-here
```

### 4. Run the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### User Profile

- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)
- `GET /api/users/potential-matches` - Get potential matches (requires auth)

### Matches

- `POST /api/matches/like/:userId` - Like a user (requires auth)
- `POST /api/matches/pass/:userId` - Pass on a user (requires auth)
- `GET /api/matches` - Get all mutual matches (requires auth)

### Messages

- `POST /api/messages/:matchId` - Send message to a match (requires auth)
- `GET /api/messages/:matchId` - Get conversation with a match (requires auth)
- `GET /api/messages/unread/count` - Get unread message count (requires auth)

## API Usage Examples

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Update Profile

```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "age": 25,
    "gender": "male",
    "bio": "Looking for meaningful connections",
    "interests": ["hiking", "reading", "travel"]
  }'
```

### Like a User

```bash
curl -X POST http://localhost:5000/api/matches/like/2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Schema

### Users Table
- id, email, password_hash, name, age, gender, bio, location
- photos (JSONB), interests (JSONB), preferences (JSONB)
- created_at, updated_at

### Matches Table
- id, user_id, target_user_id, action (like/pass)
- created_at

### Messages Table
- id, sender_id, receiver_id, content
- read_at, created_at

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # PostgreSQL connection
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── matchController.ts
│   │   └── messageController.ts
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication
│   │   └── validation.ts        # Input validation
│   ├── models/
│   │   ├── User.ts
│   │   ├── Match.ts
│   │   └── Message.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── matches.ts
│   │   └── messages.ts
│   ├── types/
│   │   └── index.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## Security Notes

- Always use HTTPS in production
- Change JWT_SECRET to a strong random string
- Never commit `.env` file to version control
- Implement rate limiting for production
- Add input sanitization for user-generated content
