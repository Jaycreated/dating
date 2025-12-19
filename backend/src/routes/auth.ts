import express, { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { 
  validateRegistration, 
  validateLogin, 
  validateChangePassword,
  handleValidationErrors 
} from '../middleware/validation';
import { body } from 'express-validator';

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
  // First parse the body
  express.json(),
  // Then authenticate
  authenticate,
  // Then validate
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
  ],
  handleValidationErrors,
  AuthController.changePassword
);

// POST /api/auth/logout
router.post('/logout', authenticate, AuthController.logout);

// POST /api/auth/create-web-session
// Creates a short one-time session link for the web (single-use)
router.post('/create-web-session', authenticate, AuthController.createWebSession);

export default router;
