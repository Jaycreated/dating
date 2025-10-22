import { Router } from 'express';
import { MatchController } from '../controllers/matchController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/matches/like/:userId
router.post('/like/:userId', MatchController.likeUser);

// POST /api/matches/pass/:userId
router.post('/pass/:userId', MatchController.passUser);

// GET /api/matches
router.get('/', MatchController.getMatches);

export default router;
