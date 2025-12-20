import { Request, Response } from 'express';
import { pool } from '../config/database';
import { 
  initializePayment,
  verifyTransaction
} from '../services/paystack.service';

// Add constants for better maintainability
const PLAN_DURATION = {
  daily: 24 * 60 * 60 * 1000, // 24 hours in ms
  monthly: 30 * 24 * 60 * 60 * 1000 // 30 days in ms
} as const;

type PlanType = keyof typeof PLAN_DURATION;

const isValidPlanType = (plan: any): plan is PlanType => {
  return plan === 'daily' || plan === 'monthly';
};

export const initializeChatPayment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get user details
    const userQuery = await client.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = userQuery.rows[0];
    
    // Validate input
    const { amount: rawAmount, planType, orderId, callbackUrl } = req.body;

    // Validate callbackUrl against whitelist if provided
    if (callbackUrl) {
      const whitelist = (process.env.CALLBACK_URL_WHITELIST || '').split(',').map(s => s.trim()).filter(Boolean);
      const isAllowed = whitelist.length === 0
        ? false
        : whitelist.some(pattern => {
            try {
              const url = new URL(callbackUrl);
              // pattern can be a full origin or a prefix like myapp:// or https://example.com
              if (pattern.endsWith('://')) {
                return url.protocol === pattern.replace('://','') + ':';
              }
              if (pattern.includes('://')) {
                return callbackUrl.startsWith(pattern);
              }
              // otherwise treat as host match
              return url.host === pattern;
            } catch (e) {
              return false;
            }
          });

      if (!isAllowed) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Invalid callbackUrl' });
      }
    }
    let amount = rawAmount;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }
    
    if (!isValidPlanType(planType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid plan type. Must be "daily" or "monthly"' 
      });
    }
    
    await client.query('BEGIN');

    // If orderId provided, validate order
    if (orderId) {
      const orderRes = await client.query(
        'SELECT id, user_id, amount, status FROM orders WHERE id = $1 FOR UPDATE',
        [orderId]
      );

      if (orderRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const order = orderRes.rows[0];
      if (order.user_id !== user.id) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, error: 'Order does not belong to user' });
      }

      // If amount wasn't provided or mismatched, ensure it matches the order
      if (!rawAmount) {
        amount = order.amount;
      } else if (Number(order.amount) !== Number(amount)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Amount does not match order' });
      }
    }

    // Initialize payment with Paystack
    const result = await initializePayment(user.email, amount, {
      userId: user.id,
      service: 'chat_access',
      planType
    }, callbackUrl);
    
    if (!result.success || !result.data) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: result.error || 'Failed to initialize payment' 
      });
    }

    const { payment_url, reference, provider_transaction_id } = result.data;

    if (!payment_url || !reference) {
      await client.query('ROLLBACK');
      throw new Error('Payment URL or reference not received from payment processor');
    }

    // Save transaction record first (with metadata, order mapping and provider id)
    await client.query(
      `INSERT INTO payment_transactions 
       (user_id, order_id, reference, provider_transaction_id, amount, status, payment_method, service_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, orderId || null, reference, provider_transaction_id || null, amount, 'pending', 'card', 'chat_access', JSON.stringify({ planType })]
    );

    // Update user's payment reference
    await client.query(
      'UPDATE users SET payment_reference = $1 WHERE id = $2',
      [reference, userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        payment_url,
        reference,
        amount,
        planType,
        instructions: 'You will be redirected to complete your payment.'
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing payment:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize payment' });
  } finally {
    client.release();
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { reference, email } = req.body;
    const userId = (req as any).user?.id;

    if (!reference) {
      return res.status(400).json({ success: false, error: 'Reference is required' });
    }

    await client.query('BEGIN');

    // Get existing transaction with FOR UPDATE to lock the row
    const existingTx = await client.query(
      `SELECT status, user_id, metadata, amount 
       FROM payment_transactions 
       WHERE reference = $1 
       FOR UPDATE`,
      [reference]
    );

    if (existingTx.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        error: 'Transaction not found' 
      });
    }

    const transaction = existingTx.rows[0];

    // Verify with Paystack (even if already successful, for consistency)
    const result = await verifyTransaction(reference);
    
    if (!result.success) {
      await client.query('ROLLBACK');
      console.error('Paystack verification failed:', result.error);
      return res.status(400).json({ 
        success: false, 
        error: result.error || 'Payment verification failed' 
      });
    }

    const { status, amount, paid_at } = result.data || {};
    
    // Convert amounts to numbers for comparison
    const paystackAmount = Number(amount);
    const expectedAmount = Number(transaction.amount) * 100; // Convert to kobo for comparison
    
    // Log amounts for debugging
    console.log('Verifying payment amounts:', {
      paystackAmount,
      expectedAmount,
      storedAmount: transaction.amount,
      reference: reference
    });
    
    // Check if amounts match (within a small range to handle floating point issues)
    if (Math.abs(paystackAmount - expectedAmount) > 1) {
      console.error(`Amount mismatch: expected ${expectedAmount}, got ${paystackAmount}`);
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: 'Payment amount does not match expected amount' 
      });
    }
    
    // If payment not successful, return appropriate response
    if (status !== 'success') {
      await client.query('ROLLBACK');
      return res.json({ 
        success: false, 
        paid: false,
        status,
        message: 'Payment not yet completed' 
      });
    }

    // Verify amount matches (security check)
    if (amount && transaction.amount) {
      // Convert amounts to numbers for comparison
      const paystackAmountInKobo = Number(amount);
      const expectedAmountInKobo = Math.round(Number(transaction.amount) * 100); // Convert Naira to kobo
      
      // Log amounts for debugging
      console.log('Payment verification - Verifying payment amounts:', {
        paystackAmountInKobo,
        expectedAmountInKobo,
        storedAmountInNaira: transaction.amount,
        reference: reference
      });
      
      // Check if amounts match (within a small range to handle floating point issues)
      if (Math.abs(paystackAmountInKobo - expectedAmountInKobo) > 1) {
        console.error(`Payment verification - Amount mismatch: expected ${expectedAmountInKobo} kobo (${transaction.amount} NGN), got ${paystackAmountInKobo} kobo`);
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          error: `Payment amount (${(paystackAmountInKobo / 100).toFixed(2)} NGN) does not match expected amount (${transaction.amount} NGN)`
        });
      }
    }

    // If we don't have a user ID from session, try to get it from the transaction or email
    let targetUserId = transaction.user_id || userId;
    const metadata = transaction.metadata || {};
    const planType = metadata.planType || 'monthly';

    // If we still don't have a user ID but have an email, try to find the user
    if (!targetUserId && email) {
      const userQuery = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (userQuery.rows.length > 0) {
        targetUserId = userQuery.rows[0].id;
      } else {
        throw new Error('Unable to determine user for this payment');
      }
    }

    // If already processed, just return success (idempotent)
    if (transaction.status === 'success') {
      await client.query('COMMIT');
      return res.json({ 
        success: true, 
        paid: true,
        message: 'Payment already verified. Chat access confirmed!' 
      });
    }

    // Calculate expiry date based on plan type
    let expiryDate = new Date();
    if (isValidPlanType(planType)) {
      expiryDate = new Date(Date.now() + PLAN_DURATION[planType]);
    } else {
      expiryDate = new Date(Date.now() + PLAN_DURATION.monthly);
    }

    // Update transaction status
    await client.query(
      `UPDATE payment_transactions 
       SET status = $1, 
           updated_at = NOW(),
           paid_at = $2
       WHERE reference = $3`,
      [status, paid_at || new Date(), reference]
    );

    // Update user's chat access with expiry
    await client.query(
      `UPDATE users 
       SET has_chat_access = true, 
           payment_date = NOW(), 
           access_expiry_date = $1,
           payment_reference = $2 
       WHERE id = $3`,
      [expiryDate, reference, targetUserId]
    );

    await client.query('COMMIT');

    console.log(`Successfully verified payment ${reference} for user ${targetUserId}`);
    console.log(`Granted ${planType} chat access until ${expiryDate.toISOString()}`);

    res.json({
      success: true,
      paid: true,
      planType,
      expiryDate: expiryDate.toISOString(),
      message: 'Payment verified successfully. Chat access granted!'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify payment. Please contact support.' 
    });
  } finally {
    client.release();
  }
};

export const checkChatAccess = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    // Use a read query without locks for better performance
    const result = await pool.query(
      `SELECT 
        u.id, 
        u.has_chat_access, 
        u.payment_date,
        u.access_expiry_date,
        pt.status as payment_status,
        pt.metadata->>'planType' as plan_type,
        pt.reference as payment_reference
       FROM users u
       LEFT JOIN payment_transactions pt ON u.payment_reference = pt.reference
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { 
      has_chat_access, 
      payment_date,
      access_expiry_date,
      payment_status,
      plan_type, 
      payment_reference 
    } = result.rows[0];
    
    let hasAccess = has_chat_access === true;
    const planType = plan_type || 'none';
    
    // Check if access has expired using expiry_date
    if (hasAccess && access_expiry_date) {
      const expiryDate = new Date(access_expiry_date);
      const now = new Date();
      
      if (now > expiryDate) {
        hasAccess = false;
        // Async update without blocking the response
        pool.query(
          'UPDATE users SET has_chat_access = false WHERE id = $1',
          [userId]
        ).catch(err => console.error('Failed to update expired access:', err));
      }
    }

    res.json({
      success: true,
      hasAccess,
      planType,
      paymentDate: payment_date,
      expiryDate: access_expiry_date,
      paymentStatus: payment_status || 'none',
      reference: payment_reference
    });
  } catch (error) {
    console.error('Error checking chat access:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check chat access' 
    });
  }
};

// NEW: Webhook handler for Paystack events
export const handlePaystackWebhook = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const event = req.body;
    
    // Verify webhook signature here (implementation depends on your setup)
    // const signature = req.headers['x-paystack-signature'];
    // if (!verifyWebhookSignature(signature, event)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    if (event.event === 'charge.success') {
      const { reference, amount: paystackAmount, status } = event.data;
      
      await client.query('BEGIN');
      
      const txResult = await client.query(
        `SELECT user_id, status, metadata, amount 
         FROM payment_transactions 
         WHERE reference = $1 
         FOR UPDATE`,
        [reference]
      );
      
      if (txResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      const transaction = txResult.rows[0];
      
      // Convert amounts to numbers for comparison
      // Paystack sends amount in kobo (1 NGN = 100 kobo), we store in Naira
      const paystackAmountInKobo = Number(paystackAmount);
      const expectedAmountInKobo = Math.round(Number(transaction.amount) * 100); // Convert Naira to kobo
      
      // Log amounts for debugging
      console.log('Webhook - Verifying payment amounts:', {
        paystackAmountInKobo,
        expectedAmountInKobo,
        storedAmountInNaira: transaction.amount,
        reference: reference
      });
      
      // Check if amounts match (within a small range to handle floating point issues)
      if (Math.abs(paystackAmountInKobo - expectedAmountInKobo) > 1) {
        console.error(`Webhook - Amount mismatch: expected ${expectedAmountInKobo} kobo (${transaction.amount} NGN), got ${paystackAmountInKobo} kobo`);
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Payment amount (${(paystackAmountInKobo / 100).toFixed(2)} NGN) does not match expected amount (${transaction.amount} NGN)` 
        });
      }
      
      // Only process if not already successful
      if (transaction.status !== 'success') {
        const metadata = transaction.metadata || {};
        const planType = metadata.planType || 'monthly';
        
        let expiryDate = new Date();
        if (isValidPlanType(planType)) {
          expiryDate = new Date(Date.now() + PLAN_DURATION[planType]);
        }
        
        await client.query(
          `UPDATE payment_transactions 
           SET status = $1, updated_at = NOW(), paid_at = NOW()
           WHERE reference = $2`,
          [status, reference]
        );
        
        await client.query(
          `UPDATE users 
           SET has_chat_access = true, 
               payment_date = NOW(),
               access_expiry_date = $1,
               payment_reference = $2 
           WHERE id = $3`,
          [expiryDate, reference, transaction.user_id]
        );
        
        console.log(`Webhook: Granted access to user ${transaction.user_id} via ${reference}`);
      }
      
      await client.query('COMMIT');
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  } finally {
    client.release();
  }
};