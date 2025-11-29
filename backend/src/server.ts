// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import { initializeDatabase, pool } from './config/database';
import { MessageModel } from './models/Message';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import matchRoutes from './routes/matches';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import paymentRoutes from './routes/payment.routes';

const app = express();
const httpServer = createServer(app);

// Allowed origins for web clients
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19000', // Expo Go LAN
  'http://localhost:19006', // Expo Web
].filter(Boolean);

// --------------------------
// FIXED MOBILE + WEB CORS
// --------------------------
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Mobile apps, Postman & curl send NO ORIGIN → ALLOW
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------------
// SOCKET.IO FIXED CORS
// --------------------------
const io = new Server(httpServer, {
  cors: {
    origin: (origin: string | undefined, callback: Function) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.log("❌ Blocked by Socket.IO CORS:", origin);
      callback(new Error("Socket.IO CORS blocked"));
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  },
});

// --------------------------
// BASIC LOGGING
// --------------------------
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// --------------------------
// HEALTH CHECK
// --------------------------
app.get('/health', (_req, res) => {
  const envInfo = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    jwtSecret: process.env.JWT_SECRET ? '***SET***' : '***MISSING***',
    databaseUrl: process.env.DATABASE_URL ? '***SET***' : '***MISSING***',
    frontendUrl: process.env.FRONTEND_URL || 'Not set',
  };

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envInfo,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  });
});

// --------------------------
// API ROUTES
// --------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// --------------------------
// STATIC FRONTEND FILES
// --------------------------
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API 404 handler
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Return frontend for all non-API GETs
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// --------------------------
// ERROR HANDLER
// --------------------------
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// --------------------------
// SOCKET.IO AUTH
// --------------------------
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.error('❌ [SOCKET] No token provided');
    return next(new Error('Authentication token is required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };

    if (!decoded?.userId) {
      console.error('❌ [SOCKET] Invalid token format');
      return next(new Error('Invalid token format'));
    }

    const userId = decoded.userId;

    const result = await pool.query(
      'SELECT id, has_chat_access FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return next(new Error('User not found'));
    }

    const user = result.rows[0];

    if (!user.has_chat_access) {
      return next(new Error('Payment required for chat access'));
    }

    socket.data.userId = userId;
    next();
  } catch (error) {
    console.error('❌ [SOCKET] Token verification failed:', error);
    next(new Error('Invalid or expired token'));
  }
});

// --------------------------
// SOCKET.IO HANDLERS
// --------------------------
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  console.log(`👤 User ${userId} connected via Socket.IO`);

  socket.join(`user:${userId}`);

  socket.on('join_conversation', (matchId: number) => {
    socket.join(`conversation:${matchId}`);
  });

  socket.on('leave_conversation', (matchId: number) => {
    socket.leave(`conversation:${matchId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { matchId, receiverId, content } = data;

      const message = await MessageModel.create(userId, receiverId, content);

      io.to(`conversation:${matchId}`).emit('new_message', {
        id: message.id,
        sender_id: userId,
        receiver_id: receiverId,
        content: message.content,
        created_at: message.created_at,
      });

      io.to(`user:${receiverId}`).emit('message_notification', {
        from_user_id: userId,
        match_id: matchId,
        content,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('typing', (data) => {
    io.to(`user:${data.receiverId}`).emit('user_typing', {
      match_id: data.matchId,
      user_id: userId,
    });
  });

  socket.on('stop_typing', (data) => {
    io.to(`user:${data.receiverId}`).emit('user_stop_typing', {
      match_id: data.matchId,
      user_id: userId,
    });
  });

  socket.on('disconnect', () => {
    console.log(`👤 User ${userId} disconnected`);
  });
});

// --------------------------
// START SERVER
// --------------------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initializeDatabase();

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💚 Health: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.IO ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
