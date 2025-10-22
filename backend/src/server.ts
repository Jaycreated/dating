// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { initializeDatabase } from './config/database';
import { MessageModel } from './models/Message';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import matchRoutes from './routes/matches';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dating API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
    socket.data.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
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
