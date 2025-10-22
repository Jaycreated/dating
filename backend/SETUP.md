# Quick Setup with Neon Database

## 1. Create .env file

```bash
cd backend
cp .env.example .env
```

The `.env` file is already configured with your Neon database URL:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# PostgreSQL Configuration (Use either DATABASE_URL or individual settings)
DATABASE_URL=postgresql://neondb_owner:npg_4DSTJuzG8NbK@ep-autumn-queen-adrfn54i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 2. Install Dependencies

```bash
# From the root directory
npm run install:all
```

## 3. Run the Application

```bash
# From the root directory
npm run dev
```

This will start:
- Backend API: http://localhost:5000
- Frontend: http://localhost:3000

## 4. Database Tables

The database tables will be automatically created when the backend starts:
- `users` - User profiles and authentication
- `matches` - User likes/passes and mutual matches
- `messages` - Messages between matched users

## Notes

- The Neon database is already configured with SSL support
- No need to manually create tables - they're created automatically
- The connection pool is configured for optimal performance with Neon
