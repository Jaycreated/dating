import { Response } from 'express';
import { MessageModel } from '../models/Message';
import { MatchModel } from '../models/Match';
import { AuthRequest } from '../middleware/auth';

export class MessageController {
  static async sendMessage(req: AuthRequest, res: Response) {
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

      const message = await MessageModel.create(req.userId!, receiverId, content.trim());

      res.status(201).json({
        message: 'Message sent successfully',
        data: message,
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  static async getConversation(req: AuthRequest, res: Response) {
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

  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const count = await MessageModel.getUnreadCount(req.userId!);

      res.json({ unreadCount: count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }
}
