import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { authenticate, requirePayment } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Payment verification for all message routes
router.use(requirePayment);

// POST /api/messages/:matchId
router.post('/:matchId', MessageController.sendMessage);

// GET /api/messages/:matchId
router.get('/:matchId', MessageController.getConversation);

// GET /api/messages/unread/count
router.get('/unread/count', MessageController.getUnreadCount);

export default router;
