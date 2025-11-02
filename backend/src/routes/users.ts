import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validateProfile, handleValidationErrors } from '../middleware/validation';
import { validateUserIdParam } from '../utils/validation';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

const router = express.Router();

// Public routes
// GET /api/users/:id - Get public profile by ID
router.get('/:id(\\d+)', optionalAuthenticate, validateUserIdParam, UserController.getPublicProfile);

// Authenticated routes - all routes below this will require authentication
router.use(authenticate);

// GET /api/users/profile - Get current user's profile
router.get('/profile', (req, res, next) => {
  // Skip validation and directly use the authenticated user's ID
  (req as any).validatedUserId = req.userId;
  next();
}, UserController.getProfile);

// PUT /api/users/profile
router.put('/profile', validateProfile, handleValidationErrors, UserController.updateProfile);

// GET /api/users/settings - Get user settings
router.get('/settings', UserController.getSettings);

// PUT /api/users/settings - Update user settings
router.put('/settings', UserController.updateSettings);

// GET /api/users/potential-matches - Get potential matches
router.get('/potential-matches', (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 [ROUTE] /api/users/potential-matches - Request received');
  console.log(`🔑 [ROUTE] Authenticated user ID:`, req.userId);
  
  if (!req.userId) {
    const error = '❌ [ROUTE] No user ID found in request';
    console.error(error);
    return res.status(401).json({ 
      success: false,
      error: 'Authentication required',
      details: {
        authHeader: !!req.headers.authorization,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  next();
}, UserController.getPotentialMatches);

export default router;
