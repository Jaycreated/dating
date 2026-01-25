import { Request, Response } from 'express';
import { MessageModel } from '../models/Message';
import { MatchModel } from '../models/Match';
import { pool } from '../config/database';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export class MessageController {
  static async sendMessage(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const receiverId = parseInt(req.params.matchId);
      const { content } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Check if users are matched
      const isMutualMatch = await MatchModel.checkMutualMatch(req.userId!, receiverId);
      if (!isMutualMatch) {
        return res.status(403).json({ error: 'Can only message matched users' });
      }

      // Enforce + increment free message usage transactionally for non-subscribers
      await client.query('BEGIN');

      const entitlementRes = await client.query(
        `SELECT has_chat_access, access_expiry_date, free_messages_used
         FROM users
         WHERE id = $1
         FOR UPDATE`,
        [req.userId!]
      );

      if (!entitlementRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      const row = entitlementRes.rows[0];
      const expired = row.access_expiry_date && new Date() > new Date(row.access_expiry_date);
      const hasSubscriptionAccess = row.has_chat_access && !expired;

      const FREE_MESSAGES_LIMIT = 3;
      const freeMessagesUsed = Number(row.free_messages_used ?? 0);
      const freeMessagesRemaining = Math.max(0, FREE_MESSAGES_LIMIT - freeMessagesUsed);

      if (!hasSubscriptionAccess && freeMessagesRemaining <= 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          error: 'Premium Feature: Chat Access',
          code: 'SUBSCRIPTION_REQUIRED',
          message: '🔒 Upgrade to Premium to continue chatting',
          details: {
            redirectTo: '/pricing',
            freeMessages: {
              limit: FREE_MESSAGES_LIMIT,
              used: freeMessagesUsed,
              remaining: freeMessagesRemaining
            }
          }
        });
      }

      const messageResult = await client.query(
        `INSERT INTO messages (sender_id, receiver_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [req.userId!, receiverId, content.trim()]
      );
      const message = messageResult.rows[0];

      if (!hasSubscriptionAccess) {
        await client.query(
          `UPDATE users
           SET free_messages_used = free_messages_used + 1
           WHERE id = $1`,
          [req.userId!]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Message sent successfully',
        data: message,
      });
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // ignore rollback errors
      }
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    } finally {
      client.release();
    }
  }

  static async getConversation(req: Request, res: Response) {
    try {
      const otherUserId = parseInt(req.params.matchId);

      // Check if users are matched
      const isMutualMatch = await MatchModel.checkMutualMatch(req.userId!, otherUserId);
      if (!isMutualMatch) {
        return res.status(403).json({ error: 'Can only view messages with matched users' });
      }

      const messages = await MessageModel.getConversation(req.userId!, otherUserId);

      res.json({ messages });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  }

  static async getUnreadCount(req: Request, res: Response) {
    try {
      const count = await MessageModel.getUnreadCount(req.userId!);

      res.json({ unreadCount: count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }
}
