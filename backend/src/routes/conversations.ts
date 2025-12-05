import { Router, Request, Response } from 'express';
import { MessageModel } from '../models/Message';
import { authenticate, requirePayment } from '../middleware/auth';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

const router = Router();

// All routes require authentication
router.use(authenticate);

// Payment verification for all routes
router.use(requirePayment);

// GET /api/conversations - Get all conversations for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const conversations = await MessageModel.getConversations(req.userId!);
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
