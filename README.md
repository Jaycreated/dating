# Pairfect - Dating/Matchmaking Application

A modern, full-stack matchmaking application built with a monolithic architecture. Where real people connect & match simply.

## 🏗️ Architecture

**Monolithic Structure** - Backend and Frontend in the same repository

```
dating/
├── backend/          # Node.js + Express + TypeScript + PostgreSQL
├── frontend/         # React + TypeScript + Vite + TailwindCSS
├── package.json      # Root package.json with monorepo scripts
└── README.md
```

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React

## ✨ Features

- ✅ User authentication (register, login, JWT)
- ✅ Beautiful landing page
- ✅ User profile management
- ✅ Matchmaking system (like/pass)
- ✅ Mutual match detection
- ✅ Messaging between matched users
- ✅ Responsive design
- ✅ Modern UI with animations

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install all dependencies (root, backend, frontend)
npm run install:all
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

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

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

### 4. Run the Application

**Development Mode** (runs both backend and frontend):

```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:5000`
- Frontend on `http://localhost:3000`

**Or run separately:**

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (auth required)

### User Profile
- `GET /api/users/profile` - Get user profile (auth required)
- `PUT /api/users/profile` - Update profile (auth required)
- `GET /api/users/potential-matches` - Get potential matches (auth required)

### Matches
- `POST /api/matches/like/:userId` - Like a user (auth required)
- `POST /api/matches/pass/:userId` - Pass on a user (auth required)
- `GET /api/matches` - Get all mutual matches (auth required)

### Messages
- `POST /api/messages/:matchId` - Send message (auth required)
- `GET /api/messages/:matchId` - Get conversation (auth required)
- `GET /api/messages/unread/count` - Get unread count (auth required)

## 🧪 Testing the API

### Using the Test Script

```bash
cd backend
chmod +x test-api.sh
./test-api.sh
```

### Using Postman

Import `backend/postman_collection.json` into Postman for a complete API collection.

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"John Doe"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📁 Project Structure

### Backend Structure
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
└── tsconfig.json
```

### Frontend Structure
```
frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx      # Beautiful landing page
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
└── vite.config.ts
```

## 🎨 Design Features

- **Modern gradient backgrounds** (pink to purple)
- **Animated elements** (floating hearts, sparkles)
- **Card-based UI** with smooth transitions
- **Responsive design** for all screen sizes
- **Clean typography** with Inter font
- **Smooth animations** and hover effects

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Protected API routes
- CORS enabled
- SQL injection prevention with parameterized queries

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

This will:
1. Build the backend TypeScript to JavaScript
2. Build the frontend React app for production

### Run Production Server

```bash
npm start
```

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

ISC

## 🎯 Future Enhancements

- [ ] Real-time messaging with WebSockets
- [ ] Photo upload functionality
- [ ] Advanced matching algorithm
- [ ] User location-based matching
- [ ] Email verification
- [ ] Password reset functionality
- [ ] User blocking/reporting
- [ ] Profile verification
- [ ] Video chat integration
- [ ] Mobile app (React Native)

---

Built with ❤️ using modern web technologies
