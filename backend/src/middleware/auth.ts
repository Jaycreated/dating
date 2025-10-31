import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const verifyUser = async () => {
    try {
      const authHeader = req.headers.authorization;
      console.log(`🔑 [AUTH] Authorization header: ${authHeader ? 'Present' : 'Missing'}`);
      
      if (!authHeader) {
        console.error('❌ [AUTH] No authorization header found');
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.split(' ')[1]; // Bearer TOKEN
      if (!token) {
        console.error('❌ [AUTH] No token found in Authorization header');
        return res.status(401).json({ error: 'Authentication token is required' });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: any };
        console.log('🔍 [AUTH] Decoded token:', decoded);
        
        if (!decoded || !decoded.userId) {
          const error = '❌ [AUTH] Token is missing userId';
          console.error(error, { decoded });
          return res.status(401).json({ 
            error: 'Invalid token format',
            details: { decoded }
          });
        }
        
        // Ensure userId is a number
        const userId = typeof decoded.userId === 'string' 
          ? parseInt(decoded.userId, 10) 
          : Number(decoded.userId);
          
        if (isNaN(userId) || userId <= 0) {
          const error = `❌ [AUTH] Invalid userId in token: ${decoded.userId} (type: ${typeof decoded.userId})`;
          console.error(error);
          return res.status(401).json({ 
            error: 'Invalid user ID in token',
            details: {
              received: decoded.userId,
              type: typeof decoded.userId,
              expected: 'positive number',
              parsed: userId,
              isNaN: isNaN(userId),
              isPositive: userId > 0
            }
          });
        }

        console.log(`✅ [AUTH] Token verified successfully for user ID: ${userId} (type: ${typeof userId})`);
        
        // Verify the user exists in the database
        try {
          const result = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
          );
          
          if (result.rows.length === 0) {
            console.error(`❌ [AUTH] User with ID ${userId} not found in database`);
            return res.status(401).json({ 
              error: 'User not found',
              details: {
                userId,
                type: typeof userId
              }
            });
          }
          
          // User exists, set userId on request and proceed
          req.userId = userId;
          console.log(`🔗 [AUTH] Set req.userId to: ${req.userId} (type: ${typeof req.userId})`);
          next();
          
        } catch (dbError) {
          console.error('❌ [AUTH] Database error during user verification:', dbError);
          return res.status(500).json({ 
            error: 'Error verifying user',
            details: dbError instanceof Error ? dbError.message : 'Unknown error'
          });
        }
        
      } catch (error) {
        console.error('❌ [AUTH] Token verification failed:', error);
        return res.status(401).json({ 
          error: 'Invalid or expired token',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (error) {
      console.error('❌ [AUTH] Authentication error:', error);
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  
  // Start the verification process
  verifyUser().catch(error => {
    console.error('❌ [AUTH] Unhandled error in authentication:', error);
    res.status(500).json({
      error: 'Internal server error during authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  });
};

export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      req.userId = decoded.userId;
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.warn('⚠️ [AUTH] Optional authentication failed, continuing as guest');
    }
  }
  
  next();
};

/**
 * Middleware to check if user has paid for chat access
 * Must be used after authenticate middleware
 */
export const requirePayment = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`🔒 [PAYMENT] Checking chat access for user ${req.userId}`);
  
  if (!req.userId) {
    console.error('❌ [PAYMENT] No user ID in request - authentication may have failed');
    return res.status(401).json({ 
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    console.log(`🔍 [PAYMENT] Checking chat access for user ID: ${req.userId}`);
    // Get user's chat access status, payment details, and plan type
    const result = await pool.query(
      `SELECT u.id, u.has_chat_access, u.payment_date, u.payment_reference,
              pt.metadata->>'planType' as plan_type
       FROM users u
       LEFT JOIN payment_transactions pt ON u.payment_reference = pt.reference
       WHERE u.id = $1
       ORDER BY pt.created_at DESC
       LIMIT 1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      console.error(`❌ [PAYMENT] User not found with ID: ${req.userId}`);
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];
    console.log(`ℹ️ [PAYMENT] User ${user.id} chat access: ${user.has_chat_access}`);
    
    // Check if user has active subscription
    let hasValidSubscription = user.has_chat_access === true;
    let subscriptionStatus = 'none';
    
    if (hasValidSubscription && user.payment_date) {
      const paymentDate = new Date(user.payment_date);
      const now = new Date();
      const hoursDiff = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60);
      const daysDiff = hoursDiff / 24;
      
      // Check subscription expiration based on plan type
      if (user.plan_type === 'daily') {
        subscriptionStatus = 'daily';
        if (hoursDiff > 24) {
          hasValidSubscription = false;
          // Update access status in database
          await pool.query(
            'UPDATE users SET has_chat_access = false WHERE id = $1',
            [user.id]
          );
        }
      } else if (user.plan_type === 'monthly') {
        subscriptionStatus = 'monthly';
        if (daysDiff > 30) {
          hasValidSubscription = false;
          // Update access status in database
          await pool.query(
            'UPDATE users SET has_chat_access = false WHERE id = $1',
            [user.id]
          );
        }
      }
    }
    
    if (!hasValidSubscription) {
      console.log(`🚫 [PAYMENT] User ${user.id} does not have valid chat access`);
      return res.status(403).json({ 
        success: false,
        error: 'Subscription required or expired',
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'You need an active subscription to access chat features',
        details: {
          userId: user.id,
          hasActiveSubscription: false,
          subscriptionStatus,
          lastPaymentDate: user.payment_date,
          paymentReference: user.payment_reference,
          planType: user.plan_type
        }
      });
    }

    console.log(`✅ [PAYMENT] User ${user.id} has valid chat access`);
    next();
  } catch (error) {
    console.error('❌ [PAYMENT] Error verifying payment status:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to verify payment status',
      code: 'PAYMENT_VERIFICATION_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
