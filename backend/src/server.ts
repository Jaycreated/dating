// Load environment variables FIRST before any other imports
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
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint with detailed info
app.get('/health', (_req, res) => {
  const envInfo = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    jwtSecret: process.env.JWT_SECRET ? '***SET***' : '***MISSING***',
    databaseUrl: process.env.DATABASE_URL ? '***SET***' : '***MISSING***',
    frontendUrl: process.env.FRONTEND_URL || 'Not set, using default',
  };
  
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envInfo,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// API Routes - MUST come before static file serving
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// Serve static files from the React frontend app
// The path goes up two levels from dist/server.js to reach frontend/dist
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API 404 handler for undefined API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// All other GET requests not handled by API routes return the React app
// This enables client-side routing to work properly
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.error('❌ [SOCKET] No token provided');
    return next(new Error('Authentication token is required'));
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
    
    if (!decoded || !decoded.userId) {
      console.error('❌ [SOCKET] Invalid token format');
      return next(new Error('Invalid token format'));
    }
    
    const userId = decoded.userId;
    
    // Verify user has chat access
    try {
      const result = await pool.query(
        'SELECT id, has_chat_access FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        console.error(`❌ [SOCKET] User not found with ID: ${userId}`);
        return next(new Error('User not found'));
      }
      
      const user = result.rows[0];
      
      if (!user.has_chat_access) {
        console.log(`🚫 [SOCKET] User ${userId} does not have chat access`);
        return next(new Error('Payment required for chat access'));
      }
      
      // All checks passed, attach user ID to socket
      socket.data.userId = userId;
      console.log(`✅ [SOCKET] User ${userId} authenticated successfully`);
      next();
      
    } catch (dbError) {
      console.error('❌ [SOCKET] Database error during authentication:', dbError);
      return next(new Error('Authentication error'));
    }
    
  } catch (error) {
    console.error('❌ [SOCKET] Token verification failed:', error);
    return next(new Error('Invalid or expired token'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  console.log(`👤 User ${userId} connected via Socket.IO`);

  // Join user's personal room
  socket.join(`user:${userId}`);

  // Join conversation room
  socket.on('join_conversation', (matchId: number) => {
    socket.join(`conversation:${matchId}`);
    console.log(`User ${userId} joined conversation ${matchId}`);
  });

  // Leave conversation room
  socket.on('leave_conversation', (matchId: number) => {
    socket.leave(`conversation:${matchId}`);
    console.log(`User ${userId} left conversation ${matchId}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data: { matchId: number; receiverId: number; content: string }) => {
    try {
      const { matchId, receiverId, content } = data;

      // Save message to database
      const message = await MessageModel.create(userId, receiverId, content);

      // Emit to both users in the conversation
      io.to(`conversation:${matchId}`).emit('new_message', {
        id: message.id,
        sender_id: userId,
        receiver_id: receiverId,
        content: message.content,
        created_at: message.created_at,
      });

      // Also emit to receiver's personal room if they're not in the conversation
      io.to(`user:${receiverId}`).emit('message_notification', {
        from_user_id: userId,
        match_id: matchId,
        content: content,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data: { matchId: number; receiverId: number }) => {
    io.to(`user:${data.receiverId}`).emit('user_typing', {
      match_id: data.matchId,
      user_id: userId,
    });
  });

  socket.on('stop_typing', (data: { matchId: number; receiverId: number }) => {
    io.to(`user:${data.receiverId}`).emit('user_stop_typing', {
      match_id: data.matchId,
      user_id: userId,
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`👤 User ${userId} disconnected`);
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 API endpoint: http://localhost:${PORT}`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.IO ready for connections`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;