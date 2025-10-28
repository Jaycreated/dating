import { pool } from '../config/database';
import { Match } from '../types';

export class MatchModel {
  static async create(
    userId: number,
    targetUserId: number,
    action: 'like' | 'pass'
  ): Promise<Match> {
    const result = await pool.query(
      `INSERT INTO matches (user_id, target_user_id, action) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, target_user_id) 
       DO UPDATE SET action = $3
       RETURNING *`,
      [userId, targetUserId, action]
    );
    return result.rows[0];
  }

  static async checkMutualMatch(userId: number, targetUserId: number): Promise<boolean> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM matches 
       WHERE ((user_id = $1 AND target_user_id = $2) OR (user_id = $2 AND target_user_id = $1))
       AND action = 'like'`,
      [userId, targetUserId]
    );
    return parseInt(result.rows[0].count) === 2;
  }

  static async getUserMatches(userId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.age, u.bio, u.photos, m1.created_at as matched_at
       FROM matches m1
       JOIN matches m2 ON m1.user_id = m2.target_user_id AND m1.target_user_id = m2.user_id
       JOIN users u ON (u.id = m1.target_user_id)
       WHERE m1.user_id = $1 AND m1.action = 'like' AND m2.action = 'like'
       ORDER BY m1.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async getMatchAction(userId: number, targetUserId: number): Promise<string | null> {
    const result = await pool.query(
      'SELECT action FROM matches WHERE user_id = $1 AND target_user_id = $2',
      [userId, targetUserId]
    );
    return result.rows[0]?.action || null;
  }
}
