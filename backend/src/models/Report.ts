import { pool } from '../config/database';
import { Report } from '../types';

export class ReportModel {
  static async create(report: Omit<Report, 'created_at' | 'updated_at'>): Promise<Report> {
    const result = await pool.query(
      `INSERT INTO reports (
         id,
         reporter_user_id,
         reported_user_id,
         content_type,
         content_id,
         content,
         reason,
         status,
         moderation_score,
         auto_flagged,
         provider
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        report.id,
        report.reporter_user_id,
        report.reported_user_id,
        report.content_type,
        report.content_id,
        report.content,
        report.reason,
        report.status,
        report.moderation_score,
        report.auto_flagged,
        report.provider || 'none',
      ]
    );

    return result.rows[0];
  }

  static async getById(id: string): Promise<Report | null> {
    const result = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async updateStatus(id: string, status: Report['status']): Promise<Report | null> {
    const result = await pool.query(
      `UPDATE reports
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  }

  static async getPendingReports(): Promise<Report[]> {
    const result = await pool.query(
      `SELECT * FROM reports
       WHERE status = 'pending'
       ORDER BY created_at DESC`
    );
    return result.rows;
  }
}
