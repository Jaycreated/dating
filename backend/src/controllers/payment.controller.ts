import { Request, Response } from 'express';
import { pool } from '../config/database';
import { 
  initializePayment,
  verifyTransaction
} from '../services/paystack.service';

export const initializeChatPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // Assuming you have authentication middleware
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get user details
    const userQuery = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = userQuery.rows[0];
    const [firstName, ...lastNameParts] = user.name.split(' ');
    const lastName = lastNameParts.join(' ') || 'User';

    // Get amount and plan type from request body
    const { amount, planType } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }
    
    if (!planType || (planType !== 'daily' && planType !== 'monthly')) {
      return res.status(400).json({ success: false, error: 'Invalid plan type' });
    }
    
    const result = await initializePayment(user.email, amount, {
      userId: user.id,
      service: 'chat_access',
      planType
    });
    
    if (!result.success || !result.data) {
      return res.status(400).json({ 
        success: false, 
        error: result.error || 'Failed to initialize payment' 
      });
    }

    const { payment_url, reference } = result.data;

    if (!payment_url) {
      throw new Error('Payment URL not received from payment processor');
    }

    // Save payment reference to user
    await pool.query(
      'UPDATE users SET payment_reference = $1 WHERE id = $2',
      [reference, userId]
    );

    // Save transaction record
    await pool.query(
      `INSERT INTO payment_transactions 
       (user_id, reference, amount, status, payment_method, service_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, reference, amount, 'pending', 'card', 'chat_access']
    );

    res.json({
      success: true,
      data: {
        payment_url,
        reference,
        amount,
        instructions: 'You will be redirected to complete your payment.'
      }
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize payment' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.body;
    const userId = (req as any).user?.id;

    if (!reference) {
      return res.status(400).json({ success: false, error: 'Reference is required' });
    }

    // Verify with Paystack
    const result = await verifyTransaction(reference);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    const { status, amount, paid_at } = result.data;
    
    if (status !== 'success') {
      return res.json({ 
        success: false, 
        paid: false,
        message: 'Payment not yet completed' 
      });
    }

    // Update payment status in database
    await pool.query('BEGIN');
    
    // Update transaction
    await pool.query(
      `UPDATE payment_transactions 
       SET status = 'success', updated_at = NOW()
       WHERE reference = $1 AND user_id = $2`,
      [reference, userId]
    );

    // Grant chat access
    await pool.query(
      `UPDATE users 
       SET has_chat_access = TRUE, 
           payment_date = $1,
           payment_amount = $2
       WHERE id = $3`,
      [new Date(paid_at), amount / 100, userId] // Convert from kobo to naira
    );

    await pool.query('COMMIT');

    res.json({
      success: true,
      paid: true,
      message: 'Payment verified successfully. Chat access granted!'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
};

export const checkChatAccess = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    const result = await pool.query(
      'SELECT has_chat_access, payment_date FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      hasAccess: result.rows[0].has_chat_access,
      paymentDate: result.rows[0].payment_date
    });
  } catch (error) {
    console.error('Error checking chat access:', error);
    res.status(500).json({ success: false, error: 'Failed to check chat access' });
  }
};
