import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { 
  validateRegistration, 
  validateLogin, 
  validateChangePassword,
  handleValidationErrors 
} from '../middleware/validation';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRegistration, handleValidationErrors, AuthController.register);

// POST /api/auth/login
router.post('/login', validateLogin, handleValidationErrors, AuthController.login);

// GET /api/auth/me
router.get('/me', authenticate, AuthController.getMe);

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticate,
  validateChangePassword,
  handleValidationErrors,
  AuthController.changePassword
);

export default router;
