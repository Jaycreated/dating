import pool from '../config/database';
import { Message } from '../types';

export class MessageModel {
  static async create(senderId: number, receiverId: number, content: string): Promise<Message> {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [senderId, receiverId, content]
    );
    return result.rows[0];
  }

  static async getConversation(userId: number, otherUserId: number): Promise<Message[]> {
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [userId, otherUserId]
    );
    return result.rows;
  }

  static async markAsRead(messageId: number): Promise<void> {
    await pool.query(
      'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id = $1',
      [messageId]
    );
  }

  static async getUnreadCount(userId: number): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND read_at IS NULL',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}
