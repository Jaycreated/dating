# 🔑 Complete Environment Variables Guide

## Overview
Your project has **3 different environment setups**:
1. **Local Development** - Your machine
2. **Production** - Render deployment
3. **Configuration Files** - Environment templates

---

## 📋 Frontend Environment Files

### **Location:** `/frontend/.env.development` & `/frontend/.env.production`

#### `.env.development` (Local Development)
```bash
# API Configuration
VITE_API_URL=http://localhost:5000          # Points to LOCAL backend
VITE_APP_ENV=development
VITE_APP_NAME=Pairfect

# Image Upload Service
VITE_CLOUDINARY_CLOUD_NAME=dbv9f6ucg
VITE_CLOUDINARY_UPLOAD_PRESET=pairfect

# Payment Gateway (Test)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_6b71ab60a09d60fb6c8f74fbb200cbd9103e7a28
```

**When used:** 
- Run `npm run dev` locally
- Tests with local backend on `http://localhost:5000`

---

#### `.env.production` (Production Deployment)
```bash
# API Configuration
VITE_API_URL=https://dating-g2mc.onrender.com    # Points to PRODUCTION backend
VITE_APP_ENV=production
VITE_APP_NAME=Pairfect

# Image Upload Service
VITE_CLOUDINARY_CLOUD_NAME=dbv9f6ucg
VITE_CLOUDINARY_UPLOAD_PRESET=pairfect

# Payment Gateway (Test)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_6b71ab60a09d60fb6c8f74fbb200cbd9103e7a28
```

**When used:**
- Built with `npm run build`
- Deployed to Render frontend
- Uses production backend URL

---

## 🔧 Backend Environment Files

### **Location:** `/backend/.env` & `/backend/.env.example`

#### `.env` (Actual - DO NOT COMMIT)
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Database (PostgreSQL on Neon)
DATABASE_URL=postgresql://neondb_owner:npg_4DSTJuzG8NbK@...

# Frontend Configuration (for CORS)
FRONTEND_URL=http://localhost:3000  # For development

# Frontend API URL (used in backend config)
VITE_API_URL=https://dating-g2mc.onrender.com/

# Payment Gateway (Paystack)
PAYSTACK_SECRET_KEY=sk_test_3995e0067afd54934cca7f12ed9621be487465ea
PAYSTACK_PUBLIC_KEY=pk_test_6b71ab60a09d60fb6c8f74fbb200cbd9103e7a28
CHAT_ACCESS_AMOUNT=100000  # ₦1000 in kobo
```

#### `.env.example` (Template - for reference)
```bash
# Used as a template for developers
# Shows which variables are needed
# Safely committed to Git
```

---

## 🔄 How Environment Variables Work

### **Frontend (Vite)**
```
npm run dev        → Uses .env.development
npm run build      → Uses .env.production
```

### **Backend (Node.js)**
```
npm run dev        → Uses .env
npm start          → Uses .env
```

---

## 📌 Key Variable Explanations

### **Frontend Variables**

| Variable | Development | Production | Purpose |
|----------|-------------|-----------|---------|
| `VITE_API_URL` | `http://localhost:5000` | `https://dating-g2mc.onrender.com` | Backend API endpoint |
| `VITE_APP_ENV` | `development` | `production` | Environment mode |
| `VITE_CLOUDINARY_CLOUD_NAME` | `dbv9f6ucg` | `dbv9f6ucg` | Image hosting service |
| `VITE_PAYSTACK_PUBLIC_KEY` | Test key | Test key | Payment processing |

### **Backend Variables**

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Server listening port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `JWT_SECRET` | Token encryption key | Secret string (change in production!) |
| `DATABASE_URL` | PostgreSQL connection | Full connection string |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3000` |
| `PAYSTACK_SECRET_KEY` | Payment processing (server) | Test secret key |

---

## 🌍 Environment Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    DEVELOPMENT                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (.env.development)                           │
│  VITE_API_URL=http://localhost:5000                    │
│          ↓                                              │
│    Your Local Machine                                  │
│   (npm run dev)                                        │
│          ↓                                              │
│  Backend (.env)                                        │
│  PORT=5000                                             │
│  DATABASE_URL=postgresql://...                        │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (.env.production)                            │
│  VITE_API_URL=https://dating-g2mc.onrender.com        │
│          ↓                                              │
│    Render Deployment (Frontend)                        │
│   (npm run build)                                      │
│          ↓                                              │
│  Backend (.env)                                        │
│  NODE_ENV=production                                  │
│  DATABASE_URL=postgresql://...                        │
│          ↓                                              │
│    Render Deployment (Backend)                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Important Security Notes

### **DO NOT COMMIT:**
- ❌ `.env` (Backend)
- ❌ `.env.local` (if exists)
- ❌ Any file with actual secrets

### **Safe to Commit:**
- ✅ `.env.example` (Template only)
- ✅ `.env.development` (Test keys only)
- ✅ `.env.production` (Public data only)

### **Secrets in Production (Render):**
Set these in Render dashboard, NOT in files:
```
JWT_SECRET=your-actual-production-secret
DATABASE_URL=actual-production-db-url
PAYSTACK_SECRET_KEY=actual-paystack-key
FRONTEND_URL=https://your-frontend-url.onrender.com
```

---

## 🚀 Deployment Checklist

### **Before deploying to Render:**
- [ ] `.env.production` has correct `VITE_API_URL`
- [ ] Backend `.env` has production secrets (set in Render dashboard)
- [ ] `JWT_SECRET` is different from development
- [ ] `PAYSTACK_SECRET_KEY` is production key (not test)
- [ ] `DATABASE_URL` points to production database
- [ ] `FRONTEND_URL` matches your frontend domain

---

## 📝 Summary Table

| Aspect | Local Dev | Production |
|--------|-----------|-----------|
| **Frontend Build** | `npm run dev` | `npm run build` |
| **Env File** | `.env.development` | `.env.production` |
| **API URL** | `http://localhost:5000` | `https://dating-g2mc.onrender.com` |
| **Database** | Neon (shared) | Neon (same) |
| **Backend Port** | `5000` | Set by Render |
| **Secrets** | Test keys | Real keys (Render dashboard) |

---

## 🔗 File Locations
```
dating/
├── frontend/
│   ├── .env.development      ← Local frontend
│   └── .env.production       ← Production frontend
├── backend/
│   ├── .env                  ← DO NOT COMMIT
│   └── .env.example          ← Template
└── package.json              ← Main repo config
```

---

**Last Updated:** December 4, 2025
