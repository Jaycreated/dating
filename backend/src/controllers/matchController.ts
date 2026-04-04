import { Request, Response } from 'express';
import { MatchModel } from '../models/Match';
import { NotificationModel } from '../models/Notification';
import { UserModel } from '../models/User';
import { NotificationService } from '../services/notificationService';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export class MatchController {
  static async likeUser(req: Request, res: Response) {
    try {
      const targetUserId = parseInt(req.params.userId);

      if (targetUserId === req.userId) {
        return res.status(400).json({ error: 'Cannot like yourself' });
      }

      const match = await MatchModel.create(req.userId!, targetUserId, 'like');
      const isMutualMatch = await MatchModel.checkMutualMatch(req.userId!, targetUserId);

      // Get current user info for notification
      const currentUser = await UserModel.findById(req.userId!);

      if (isMutualMatch) {
        // Send match notification to both users
        await NotificationModel.create(
          targetUserId,
          req.userId!,
          'match',
          `You matched with ${currentUser?.name}!`
        );

        // Send push notification to target user
        await NotificationService.sendPushNotification(targetUserId, {
          title: "It's a Match! 🎉",
          body: `You matched with ${currentUser?.name}!`,
          data: {
            type: 'match',
            fromUserId: req.userId,
            url: '/matches'
          }
        });
      } else {
        // Send like notification to target user
        await NotificationModel.create(
          targetUserId,
          req.userId!,
          'like',
          `${currentUser?.name} liked you!`
        );

        // Send push notification for like
        await NotificationService.sendPushNotification(targetUserId, {
          title: 'New Like! 💕',
          body: `${currentUser?.name} liked you!`,
          data: {
            type: 'like',
            fromUserId: req.userId,
            url: '/swipe'
          }
        });
      }

      res.json({
        message: isMutualMatch ? "It's a match!" : 'Like recorded',
        match,
        matched: isMutualMatch,
      });
    } catch (error) {
      console.error('Like user error:', error);
      res.status(500).json({ error: 'Failed to like user' });
    }
  }

  static async passUser(req: Request, res: Response) {
    try {
      const targetUserId = parseInt(req.params.userId);

      if (targetUserId === req.userId) {
        return res.status(400).json({ error: 'Cannot pass yourself' });
      }

      const match = await MatchModel.create(req.userId!, targetUserId, 'pass');

      res.json({
        message: 'Pass recorded',
        match,
      });
    } catch (error) {
      console.error('Pass user error:', error);
      res.status(500).json({ error: 'Failed to pass user' });
    }
  }

  static async getMatches(req: Request, res: Response) {
    try {
      const matches = await MatchModel.getUserMatches(req.userId!);

      res.json({ matches });
    } catch (error) {
      console.error('Get matches error:', error);
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  }
}
