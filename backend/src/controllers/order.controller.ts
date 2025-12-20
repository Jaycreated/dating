import { Request, Response } from 'express';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const createOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { amount, id } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    // Use provided id as idempotency key, otherwise generate one
    const orderId = id || `order_${uuidv4()}`;

    // If order already exists return it (idempotent)
    const existing = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (existing.rows.length > 0) {
      return res.json({ success: true, data: existing.rows[0] });
    }

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO orders (id, user_id, amount, status, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, userId, amount, 'pending', JSON.stringify({ createdBy: 'api' })]
    );

    await client.query('COMMIT');

    const result = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  } finally {
    client.release();
  }
};

export default createOrder;
