import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret) as { userId: number };
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, email, name, has_chat_access FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Attach user to request object
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const requireChatAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Check if user has chat access
    const result = await pool.query(
      'SELECT has_chat_access FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows[0]?.has_chat_access) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: 'Chat access requires payment',
      requiresPayment: true
    });
  } catch (error) {
    console.error('Chat access check error:', error);
    res.status(500).json({ success: false, error: 'Error checking chat access' });
  }
};
