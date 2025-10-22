import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validateProfile, handleValidationErrors } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users/profile
router.get('/profile', UserController.getProfile);

// PUT /api/users/profile
router.put('/profile', validateProfile, handleValidationErrors, UserController.updateProfile);

// GET /api/users/potential-matches
router.get('/potential-matches', UserController.getPotentialMatches);

export default router;
