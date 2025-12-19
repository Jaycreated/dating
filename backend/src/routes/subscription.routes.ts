import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
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
router.get('/plans', getSubscriptionPlans);

// Webhook (no authentication, but should verify Paystack signature)
router.post('/webhook', handleSubscriptionWebhook);

// Protected routes (require authentication)
router.use(authenticate);

// Subscription management
router.post('/subscribe', createSubscription);
router.get('/me', getMySubscription);
router.delete('/cancel', cancelSubscription);

// Admin routes
router.use(isAdmin);
router.post('/plans', createSubscriptionPlan);

export default router;
