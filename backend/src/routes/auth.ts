import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRegistration, validateLogin, handleValidationErrors } from '../middleware/validation';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRegistration, handleValidationErrors, AuthController.register);

// POST /api/auth/login
router.post('/login', validateLogin, handleValidationErrors, AuthController.login);

// GET /api/auth/me
router.get('/me', authenticate, AuthController.getMe);

export default router;
