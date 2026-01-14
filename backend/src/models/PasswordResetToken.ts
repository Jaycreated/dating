import { pool } from '../config/database';

export interface PasswordResetTokenRow {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export class PasswordResetTokenModel {
  static async create(userId: number, tokenHash: string, expiresAt: Date): Promise<PasswordResetTokenRow> {
    const result = await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING *`,
      [userId, tokenHash, expiresAt.toISOString()]
    );
    return result.rows[0];
  }

  static async findByTokenHash(tokenHash: string): Promise<PasswordResetTokenRow | null> {
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token_hash = $1 LIMIT 1`,
      [tokenHash]
    );
    return result.rows[0] || null;
  }

  static async deleteById(id: number): Promise<void> {
    await pool.query(`DELETE FROM password_reset_tokens WHERE id = $1`, [id]);
  }

  static async deleteByUserId(userId: number): Promise<void> {
    await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId]);
  }
}
