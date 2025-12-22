import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  initializeChatPayment, 
  verifyPayment, 
  checkChatAccess,
  handlePaystackWebhook
} from '../controllers/payment.controller';

const router = Router();

// Webhook (no authentication, but verify Paystack signature in controller)
router.post('/webhook', handlePaystackWebhook);

// Public payment verification endpoint - Paystack/browser callbacks may not have the
// user's JWT (redirects can land in a different domain/window). Allow verifying
// a payment by reference (and optional email) without authentication; the
// controller will still attempt to resolve the user from the transaction or email.
router.post('/chat/verify', verifyPayment);

// Protected routes (require authentication)
router.use(authenticate);

// Chat payment endpoints
router.post('/chat/initialize', initializeChatPayment);
router.get('/chat/access', checkChatAccess);


export default router;
