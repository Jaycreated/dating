import { pool } from '../config/database';
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
    preferences: any = {}
  ): Promise<User[]> {
    console.log(`🔍 [MODEL] [${new Date().toISOString()}] Starting getPotentialMatches for user ${userId}`);
    console.log(`🔧 [MODEL] Preferences:`, JSON.stringify(preferences, null, 2));
    
    try {
      // First, verify the user exists
      console.log(`🔍 [MODEL] Looking up user with ID: ${userId}`);
      const user = await this.findById(userId);
      
      if (!user) {
        console.error(`❌ [MODEL] User not found with ID: ${userId}`);
        throw new Error('User not found');
      }
      
      console.log(`✅ [MODEL] Found user:`, {
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        age: user.age
      });

      // First, get the user IDs that match our criteria
      let query = `
        WITH potential_matches AS (
          SELECT u.id 
          FROM users u
          LEFT JOIN matches m ON u.id = m.target_user_id AND m.user_id = $1
          WHERE u.id != $1
          AND m.id IS NULL  -- This ensures no match exists
      `;
      
      const params: any[] = [userId];
      let paramCount = 2;

      // Only apply gender filter if it's explicitly set in preferences
      if (preferences && preferences.gender) {
        console.log(`🔧 [MODEL] Filtering by gender: ${preferences.gender}`);
        query += ` AND LOWER(u.gender) = LOWER($${paramCount})`;
        params.push(preferences.gender);
        paramCount++;
      }

      // Handle age range filters
      if (preferences && (preferences.minAge || preferences.minAge === 0)) {
        console.log(`🔧 [MODEL] Filtering by minimum age: ${preferences.minAge}`);
        query += ` AND u.age >= $${paramCount}`;
        params.push(preferences.minAge);
        paramCount++;
      }

      if (preferences && preferences.maxAge) {
        console.log(`🔧 [MODEL] Filtering by maximum age: ${preferences.maxAge}`);
        query += ` AND u.age <= $${paramCount}`;
        params.push(preferences.maxAge);
        paramCount++;
      }

      // Close the CTE and select the full user data with random ordering
      query += `
        )
        SELECT u.* 
        FROM users u
        INNER JOIN potential_matches pm ON u.id = pm.id
        ORDER BY RANDOM()
        LIMIT 20
      `;
      console.log(`🔍 [MODEL] Executing query:`, { query, params });
      
      const result = await pool.query(query, params);
      console.log(`✅ [MODEL] Found ${result.rows.length} potential matches`);
      
      return result.rows;
    } catch (error) {
      console.error('❌ [MODEL] Error in getPotentialMatches:', error);
      throw error;
    }
  }

  static async updatePassword(userId: number, newPasswordHash: string): Promise<void> {
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );
  }
}
