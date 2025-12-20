import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { pool } from '../config/database';
import { 
  initializeChatPayment, 
  verifyPayment, 
  checkChatAccess 
} from '../controllers/payment.controller';
import {
  createSubscriptionPlan,
  getSubscriptionPlans,
  createSubscription,
  getMySubscription,
  cancelSubscription,
  handleSubscriptionWebhook
} from '../controllers/subscription.controller';

const router = Router();

// Public routes
router.get('/subscription/plans', getSubscriptionPlans);

// Webhook (no authentication, but verify Paystack signature in controller)
router.post('/subscription/webhook', handleSubscriptionWebhook);

// Public payment verification endpoint - Paystack/browser callbacks may not have the
// user's JWT (redirects can land in a different domain/window). Allow verifying
// a payment by reference (and optional email) without authentication; the
// controller will still attempt to resolve the user from the transaction or email.
router.post('/chat/verify', verifyPayment);

// Protected routes (require authentication)
router.use(authenticate);

// Chat payment endpoints (initialization and access check require auth)
router.post('/chat/initialize', initializeChatPayment);
router.get('/chat/access', checkChatAccess);

// Subscription management
router.post('/subscription/subscribe', createSubscription);
router.get('/subscription/me', getMySubscription);
router.delete('/subscription/cancel', cancelSubscription);

// Admin routes (require admin role)
router.post('/subscription/plans', async (req, res, next) => {
  // Inline admin check
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Admin check failed:', error);
    res.status(500).json({ success: false, error: 'Error verifying admin status' });
  }
}, createSubscriptionPlan);

export default router;
