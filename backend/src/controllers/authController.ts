import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { redisClient } from '../config/redis';
import { UserModel } from '../models/User';
import { PasswordResetTokenModel } from '../models/PasswordResetToken';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await UserModel.create(email, passwordHash, name);

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
      // @ts-ignore - jsonwebtoken types issue
      const token = jwt.sign({ userId: user.id }, jwtSecret, { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      });

      // Remove password from response
      const { password_hash, ...userWithoutPassword } = user;

      res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
      // @ts-ignore - jsonwebtoken types issue
      const token = jwt.sign({ userId: user.id }, jwtSecret, { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      });

      // Update last_login timestamp
      const updatedUser = await UserModel.updateLastLogin(user.id);
      
      // Remove password from response
      const { password_hash, ...userWithoutPassword } = updatedUser;

      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async getMe(req: Request, res: Response) {
    try {
      const user = await UserModel.findById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password_hash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  static async changePassword(req: Request, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.userId!;

      // Get user from database
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password in database
      await UserModel.updatePassword(userId, newPasswordHash);

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }

  static async logout(_req: Request, res: Response) {
    try {
      // In a stateless JWT system, logout is handled client-side by removing the token
      // This endpoint can be used to perform any server-side cleanup if needed
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  // POST /api/auth/forgot
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });

      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Do not reveal whether the email exists
        console.log(`Password reset requested for non-existent email: ${email}`);
        return res.json({ success: true });
      }

      // Remove any existing tokens for this user
      await PasswordResetTokenModel.deleteByUserId(user.id);

      // Generate a secure random token (raw) and a hash to store
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + (60 * 60 * 1000)); // 1 hour

      await PasswordResetTokenModel.create(user.id, tokenHash, expiresAt);

      // Build reset URL (frontend)
      const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendOrigin.replace(/\/$/, '')}/reset-password?token=${rawToken}`;

      // Send email if SMTP configured. Otherwise use Ethereal (dev) and log preview URL.
      const smtpHost = process.env.SMTP_HOST;
      if (smtpHost) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          } : undefined,
        });

        const mail = await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          to: user.email,
          subject: 'Password reset',
          text: `Use this link to reset your password: ${resetUrl}`,
          html: `<p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
        });

        console.log('Password reset email sent:', mail.messageId);
      } else {
        // Use Ethereal for dev testing — this creates a test account and transporter
        try {
          const testAccount = await nodemailer.createTestAccount();
          const transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });

          const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || 'no-reply@example.com',
            to: user.email,
            subject: 'Password reset (dev)',
            text: `Use this link to reset your password: ${resetUrl}`,
            html: `<p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
          });

          const preview = nodemailer.getTestMessageUrl(info);
          console.log('Password reset sent via Ethereal. Preview URL:', preview);
        } catch (err) {
          console.log('Password reset URL (dev):', resetUrl);
        }
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset' });
    }
  }

  // POST /api/auth/reset
  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: 'Token and newPassword are required' });

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const tokenRow = await PasswordResetTokenModel.findByTokenHash(tokenHash);
      if (!tokenRow) return res.status(400).json({ error: 'Invalid or expired token' });

      const expiresAt = new Date(tokenRow.expires_at);
      if (Date.now() > expiresAt.getTime()) {
        // Delete expired token
        await PasswordResetTokenModel.deleteById(tokenRow.id);
        return res.status(400).json({ error: 'Token expired' });
      }

      // Update user password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await UserModel.updatePassword(tokenRow.user_id, newPasswordHash);

      // Delete token
      await PasswordResetTokenModel.deleteById(tokenRow.id);

      res.json({ success: true });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }

  /**
   * Create a short-lived one-time session link for converting into a web cookie session
   * POST /api/auth/create-web-session
   */
  static async createWebSession(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: 'Authentication required' });

      // Create one-time session token
      const token = uuidv4();
      const SESSION_TTL = 300; // 5 minutes in seconds
      
      // Store session in Redis with TTL
      await redisClient.set(`onetime:${token}`, userId.toString(), {
        EX: SESSION_TTL,
        NX: true
      });

      // Build a session URL on this server (so browser opens server's /session/:id endpoint)
      const protocol = req.protocol;
      const host = req.get('host');
      const serverOrigin = `${protocol}://${host}`;
      const redirectUrl = `${serverOrigin.replace(/\/$/, '')}/session/${token}`;

      res.json({
        success: true,
        redirectUrl,
        note: 'Open this URL in browser to convert into a web session and complete payment',
      });
    } catch (error) {
      console.error('Create web session error:', error);
      res.status(500).json({ error: 'Failed to create web session' });
    }
  }
}
