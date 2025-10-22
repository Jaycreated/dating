import pool from '../config/database';
import { User, UserPreferences } from '../types';

export class UserModel {
  static async create(email: string, passwordHash: string, name: string): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [email, passwordHash, name]
    );
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async update(id: number, data: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'email' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  static async getPotentialMatches(
    userId: number,
    preferences: UserPreferences
  ): Promise<User[]> {
    let query = `
      SELECT u.* FROM users u
      WHERE u.id != $1
      AND u.id NOT IN (
        SELECT target_user_id FROM matches WHERE user_id = $1
      )
    `;
    const params: any[] = [userId];
    let paramCount = 2;

    if (preferences.gender) {
      query += ` AND u.gender = $${paramCount}`;
      params.push(preferences.gender);
      paramCount++;
    }

    if (preferences.minAge) {
      query += ` AND u.age >= $${paramCount}`;
      params.push(preferences.minAge);
      paramCount++;
    }

    if (preferences.maxAge) {
      query += ` AND u.age <= $${paramCount}`;
      params.push(preferences.maxAge);
      paramCount++;
    }

    query += ' ORDER BY RANDOM() LIMIT 20';

    const result = await pool.query(query, params);
    return result.rows;
  }
}
