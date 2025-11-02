import { Request, Response } from 'express';
import { NotificationModel } from '../models/Notification';

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
}
