import { Response } from 'express';
import { MatchModel } from '../models/Match';
import { NotificationModel } from '../models/Notification';
import { UserModel } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export class MatchController {
  static async likeUser(req: AuthRequest, res: Response) {
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
      } else {
        // Send like notification to target user
        await NotificationModel.create(
          targetUserId,
          req.userId!,
          'like',
          `${currentUser?.name} liked you!`
        );
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

  static async passUser(req: AuthRequest, res: Response) {
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

  static async getMatches(req: AuthRequest, res: Response) {
    try {
      const matches = await MatchModel.getUserMatches(req.userId!);

      res.json({ matches });
    } catch (error) {
      console.error('Get matches error:', error);
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  }
}
