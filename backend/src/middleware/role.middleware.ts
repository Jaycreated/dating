import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/User';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore - req.user is added by the auth middleware
  if (req.user && req.user.role === UserRole.ADMIN) {
    return next();
  }
  
  return res.status(403).json({ 
    success: false,
    message: 'Access denied. Admin privileges required.' 
  });
};
