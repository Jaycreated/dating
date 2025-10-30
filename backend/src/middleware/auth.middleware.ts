import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: number; 
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

    const decoded = jwt.verify(token, secret) as { userId?: number | string; id?: number | string };

    // Ensure userId is always a number
    const userId = Number(decoded.userId ?? decoded.id);
    
    if (isNaN(userId) || userId <= 0) {
      throw new Error(`Invalid user ID in token: ${decoded.userId ?? decoded.id}`);
    }
    
    req.userId = userId;

    // Fetch user data
    const result = await pool.query(
      'SELECT id, email, name, has_chat_access FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};
