import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  initializeChatPayment, 
  verifyPayment, 
  checkChatAccess 
} from '../controllers/payment.controller';

const router = Router();

// Protected routes (require authentication)
router.post('/chat/initialize', authenticate, initializeChatPayment);
router.post('/chat/verify', authenticate, verifyPayment);
router.get('/chat/access', authenticate, checkChatAccess);

export default router;
