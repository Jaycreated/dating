import pool from '../config/database';

export interface Notification {
  id: number;
  user_id: number;
  from_user_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  from_user_name?: string;
  from_user_photo?: string;
}

export class NotificationModel {
  static async create(
    userId: number,
    fromUserId: number,
    type: string,
    message: string
  ): Promise<Notification> {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, from_user_id, type, message) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userId, fromUserId, type, message]
    );
    return result.rows[0];
  }

  static async getUserNotifications(userId: number): Promise<Notification[]> {
    const result = await pool.query(
      `SELECT n.*, u.name as from_user_name, u.photos as from_user_photo
       FROM notifications n
       JOIN users u ON n.from_user_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );
    return result.rows;
  }

  static async getUnreadCount(userId: number): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  static async markAsRead(notificationId: number): Promise<void> {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
      [notificationId]
    );
  }

  static async markAllAsRead(userId: number): Promise<void> {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [userId]
    );
  }

  static async deleteNotification(notificationId: number): Promise<void> {
    await pool.query(
      `DELETE FROM notifications WHERE id = $1`,
      [notificationId]
    );
  }
}
