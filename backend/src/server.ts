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
import conversationRoutes from './routes/conversations';
import notificationRoutes from './routes/notifications';
import paymentRoutes from './routes/payment.routes';
import subscriptionRoutes from './routes/subscription.routes';

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
   
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:8081'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
 
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:8081'
  ],
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
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API 404 handler for undefined API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// All other GET requests not handled by API routes return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  const statusCode = (err as any).status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
  });
});

// Helper function to verify match exists
async function verifyMatch(userId: number, receiverId: number): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM matches 
       WHERE ((user_id = $1 AND target_user_id = $2) OR (user_id = $2 AND target_user_id = $1))
       AND action = 'like'`,
      [userId, receiverId]
    );
    return parseInt(result.rows[0].count) === 2;
  } catch (error) {
    console.error('Error verifying match:', error);
    return false;
  }
}

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.error('❌ [SOCKET] No token provided');
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    
    if (!decoded || !decoded.userId) {
      console.error('❌ [SOCKET] Invalid token format');
      return next(new Error('Invalid token format'));
    }
    
    const userId = decoded.userId;
    
    // Get user's chat access status, payment details, plan type, and payment status
    const result = await pool.query(
      `SELECT 
        u.id, 
        u.has_chat_access, 
        u.payment_date, 
        u.payment_reference,
        pt.metadata->>'planType' as plan_type,
        pt.status as payment_status,
        pt.amount,
        pt.created_at as payment_created_at
       FROM users u
       LEFT JOIN payment_transactions pt ON u.payment_reference = pt.reference
       WHERE u.id = $1
       ORDER BY pt.created_at DESC
       LIMIT 1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      console.error(`❌ [SOCKET] User not found with ID: ${userId}`);
      return next(new Error('User not found'));
    }
    
    const { 
      has_chat_access, 
      payment_date, 
      plan_type, 
      payment_status,
      amount,
      payment_created_at
    } = result.rows[0];
    
    let hasAccess = false;
    
    // Check if payment was successful and valid
    if (payment_status === 'success' && payment_date) {
      const paymentDate = new Date(payment_date);
      const now = new Date();
      const hoursDiff = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60);
      const daysDiff = hoursDiff / 24;
      
      // Check subscription expiration based on plan type
      if (plan_type === 'daily') {
        hasAccess = hoursDiff <= 24;
      } else if (plan_type === 'monthly') {
        hasAccess = daysDiff <= 30;
      } else {
        // Default to 24 hours if plan type is not recognized
        hasAccess = hoursDiff <= 24;
      }
      
      // Update has_chat_access in database if needed
      if (hasAccess !== has_chat_access) {
        await pool.query(
          'UPDATE users SET has_chat_access = $1 WHERE id = $2',
          [hasAccess, userId]
        );
      }
      
      console.log(`ℹ️ [PAYMENT] User ${userId} subscription: ${plan_type || 'none'}, ` +
                 `Status: ${payment_status}, ` +
                 `Paid: ${amount ? (amount / 100).toFixed(2) : '0'}, ` +
                 `Active: ${hasAccess}`);
    } else {
      console.log(`ℹ️ [PAYMENT] User ${userId} has no valid payment. ` +
                 `Status: ${payment_status || 'no payment'}`);
    }
    
    if (!hasAccess) {
      console.log(`🚫 [SOCKET] User ${userId} does not have valid chat access`);
      return next(new Error('Payment required for chat access'));
    }
    
    // All checks passed, attach user ID to socket
    socket.data.userId = userId;
    console.log(`✅ [SOCKET] User ${userId} authenticated with valid subscription`);
    next();
  } catch (error) {
    console.error('❌ [SOCKET] Error in WebSocket auth:', error);
    return next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  console.log(`👤 User ${userId} connected via Socket.IO`);

  // Join user's personal room
  socket.join(`user:${userId}`);

  // Join conversation room
  socket.on('join_conversation', async (matchId: number) => {
    // Validate input
    if (!matchId || typeof matchId !== 'number') {
      socket.emit('error', { message: 'Invalid match ID' });
      return;
    }
    
    socket.join(`conversation:${matchId}`);
    console.log(`User ${userId} joined conversation ${matchId}`);
  });

  // Leave conversation room
  socket.on('leave_conversation', (matchId: number) => {
    if (!matchId || typeof matchId !== 'number') {
      return;
    }
    
    socket.leave(`conversation:${matchId}`);
    console.log(`User ${userId} left conversation ${matchId}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data: { matchId: number; receiverId: number; content: string }) => {
    try {
      const { matchId, receiverId, content } = data;

      // Validate input
      if (!matchId || !receiverId || !content) {
        socket.emit('message_error', { error: 'Missing required fields' });
        return;
      }

      if (typeof content !== 'string' || content.trim().length === 0) {
        socket.emit('message_error', { error: 'Message content cannot be empty' });
        return;
      }

      if (content.length > 5000) {
        socket.emit('message_error', { error: 'Message too long (max 5000 characters)' });
        return;
      }

      // Verify match exists
      const matchExists = await verifyMatch(userId, receiverId);
      if (!matchExists) {
        socket.emit('message_error', { error: 'No valid match found' });
        return;
      }

      // Save message to database
      const message = await MessageModel.create(userId, receiverId, content.trim());

      // Only emit after successful save
      const messageData = {
        id: message.id,
        sender_id: userId,
        receiver_id: receiverId,
        content: message.content,
        created_at: message.created_at,
      };

      // Emit to both users in the conversation
      io.to(`conversation:${matchId}`).emit('new_message', messageData);

      // Also emit to receiver's personal room if they're not in the conversation
      io.to(`user:${receiverId}`).emit('message_notification', {
        from_user_id: userId,
        match_id: matchId,
        content: content.trim(),
      });

      // Confirm to sender
      socket.emit('message_sent', { messageId: message.id });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { 
        error: 'Failed to send message',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data: { matchId: number; receiverId: number }) => {
    if (!data?.matchId || !data?.receiverId) {
      return;
    }
    
    io.to(`user:${data.receiverId}`).emit('user_typing', {
      match_id: data.matchId,
      user_id: userId,
    });
  });

  socket.on('stop_typing', (data: { matchId: number; receiverId: number }) => {
    if (!data?.matchId || !data?.receiverId) {
      return;
    }
    
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