import { Request, Response } from 'express';
import { NotificationModel } from '../models/Notification';
import { NotificationService } from '../services/notificationService';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const notifications = await NotificationModel.getUserNotifications(req.userId!);
      res.json({ notifications });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  static async getUnreadCount(req: Request, res: Response) {
    try {
      const count = await NotificationModel.getUnreadCount(req.userId!);
      res.json({ count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const notificationId = parseInt(req.params.id);
      await NotificationModel.markAsRead(notificationId);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      await NotificationModel.markAllAsRead(req.userId!);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  }

  static async deleteNotification(req: Request, res: Response) {
    try {
      const notificationId = parseInt(req.params.id);
      await NotificationModel.deleteNotification(notificationId);
      res.json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  /**
   * Register push token for the current user
   * POST /api/notifications/register
   */
  static async registerPushToken(req: Request, res: Response) {
    try {
      const { pushToken } = req.body;

      if (!pushToken) {
        return res.status(400).json({ error: 'Push token is required' });
      }

      await NotificationService.registerPushToken(req.userId!, pushToken);

      res.json({ 
        success: true, 
        message: 'Push token registered successfully' 
      });
    } catch (error: any) {
      console.error('Register push token error:', error);
      
      if (error.message === 'Invalid Expo push token') {
        return res.status(400).json({ error: 'Invalid Expo push token format' });
      }
      
      res.status(500).json({ error: 'Failed to register push token' });
    }
  }

  /**
   * Remove push token (e.g., on logout)
   * DELETE /api/notifications/push-token
   */
  static async removePushToken(req: Request, res: Response) {
    try {
      await NotificationService.removePushToken(req.userId!);

      res.json({ 
        success: true, 
        message: 'Push token removed successfully' 
      });
    } catch (error) {
      console.error('Remove push token error:', error);
      res.status(500).json({ error: 'Failed to remove push token' });
    }
  }

  /**
   * Get VAPID public key for web push subscription
   * GET /api/notifications/vapid-key
   */
  static async getVapidKey(req: Request, res: Response) {
    try {
      const publicKey = NotificationService.getVapidPublicKey();
      
      if (!publicKey) {
        return res.status(503).json({ error: 'Web push not configured' });
      }
      
      res.json({ publicKey });
    } catch (error) {
      console.error('Get VAPID key error:', error);
      res.status(500).json({ error: 'Failed to get VAPID key' });
    }
  }

  /**
   * Register web push subscription
   * POST /api/notifications/web-subscription
   */
  static async registerWebSubscription(req: Request, res: Response) {
    try {
      const { subscription } = req.body;

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: 'Invalid subscription data' });
      }

      await NotificationService.registerWebPushSubscription(req.userId!, subscription);

      res.json({ 
        success: true, 
        message: 'Web push subscription registered successfully' 
      });
    } catch (error) {
      console.error('Register web subscription error:', error);
      res.status(500).json({ error: 'Failed to register web push subscription' });
    }
  }

  /**
   * Remove web push subscription
   * DELETE /api/notifications/web-subscription
   */
  static async removeWebSubscription(req: Request, res: Response) {
    try {
      const { endpoint } = req.body;

      if (endpoint) {
        await NotificationService.removeWebPushSubscription(req.userId!, endpoint);
      } else {
        await NotificationService.removeAllWebPushSubscriptions(req.userId!);
      }

      res.json({ 
        success: true, 
        message: 'Web push subscription removed successfully' 
      });
    } catch (error) {
      console.error('Remove web subscription error:', error);
      res.status(500).json({ error: 'Failed to remove web push subscription' });
    }
  }
}
