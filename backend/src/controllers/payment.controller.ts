import { Request, Response } from 'express';
import { pool } from '../config/database';
import crypto from 'crypto';
import {
  initializePayment,
  verifyTransaction,
  getPaystackSecret
} from '../services/paystack.service';

/* =======================
   Constants & Types
======================= */

const PLAN_DURATION = {
  daily: 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000
} as const;

type PlanType = keyof typeof PLAN_DURATION;

const isValidPlanType = (plan: any): plan is PlanType =>
  plan === 'daily' || plan === 'monthly';

/* =======================
   Helpers
======================= */

const verifyPaystackSignature = (req: Request): boolean => {
  const signature = req.headers['x-paystack-signature'];
  if (!signature || typeof signature !== 'string') return false;

  const hash = crypto
    .createHmac('sha512', getPaystackSecret())
    .update((req as any).rawBody)
    .digest('hex');

  return hash === signature;
};

const parseMetadata = (metadata: any): Record<string, any> => {
  try {
    if (!metadata) return {};
    if (typeof metadata === 'string') return JSON.parse(metadata);
    return metadata;
  } catch {
    return {};
  }
};

/* =======================
   Initialize Payment
======================= */

export const initializeChatPayment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false });

    const { amount, planType, callbackUrl } = req.body;

    if (!amount || isNaN(amount) || amount <= 0)
      return res.status(400).json({ success: false, error: 'Invalid amount' });

    if (!isValidPlanType(planType))
      return res.status(400).json({ success: false, error: 'Invalid plan type' });

    const userRes = await client.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );
    if (!userRes.rows.length)
      return res.status(404).json({ success: false });

    await client.query('BEGIN');

    const init = await initializePayment(
      userRes.rows[0].email,
      amount,
      { service: 'chat_access', planType },
      callbackUrl
    );

    if (!init.success || !init.data) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false });
    }

    const { payment_url, reference, provider_transaction_id } = init.data;

    await client.query(
      `INSERT INTO payment_transactions
       (user_id, reference, provider_transaction_id, amount, status, service_type, metadata)
       VALUES ($1, $2, $3, $4, 'pending', 'chat_access', $5)`,
      [
        userId,
        reference,
        provider_transaction_id,
        amount,
        JSON.stringify({ planType })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: { payment_url, reference }
    });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false });
  } finally {
    client.release();
  }
};

/* =======================
   Verify Payment (Client Polling)
======================= */
export const verifyPayment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { reference } = req.body;
    console.log('[VERIFY] Starting payment verification for reference:', reference);
    
    if (!reference) {
      console.error('[VERIFY] Missing reference in request');
      return res.status(400).json({ success: false, error: 'Missing reference' });
    }

    await client.query('BEGIN');
    console.log('[VERIFY] Database transaction started');

    // Get transaction with FOR UPDATE to lock the row
    const txRes = await client.query(
      `SELECT status, amount, metadata, user_id 
       FROM payment_transactions 
       WHERE reference = $1 FOR UPDATE`,
      [reference]
    );

    if (!txRes.rows.length) {
      console.error('[VERIFY] No transaction found for reference:', reference);
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        error: 'Transaction not found' 
      });
    }

    const tx = txRes.rows[0];
    console.log('[VERIFY] Found transaction:', {
      status: tx.status,
      amount: tx.amount,
      userId: tx.user_id
    });

    // If already verified, return current status
    if (tx.status === 'success') {
      console.log('[VERIFY] Transaction already marked as successful');
      await client.query('ROLLBACK');
      return res.json({ 
        success: true, 
        paid: true,
        message: 'Payment already verified and activated'
      });
    }

    // Verify with Paystack
    console.log('[VERIFY] Verifying with Paystack...');
    const verify = await verifyTransaction(reference);
    
    if (!verify.success || !verify.data) {
      console.error('[VERIFY] Paystack verification failed:', verify.error);
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: 'Verification failed',
        details: verify.error
      });
    }

    const paystackData = verify.data;
    console.log('[VERIFY] Paystack response:', {
      status: paystackData.status,
      amount: paystackData.amount,
      reference: paystackData.reference
    });

    // Verify amount matches
    const expectedAmount = Math.round(Number(tx.amount) * 100); // Convert to kobo
    if (Math.abs(Number(paystackData.amount) - expectedAmount) > 1) {
      console.error('[VERIFY] Amount mismatch:', {
        expected: expectedAmount,
        received: paystackData.amount,
        difference: Math.abs(Number(paystackData.amount) - expectedAmount)
      });
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: 'Amount verification failed' 
      });
    }

    // Update transaction status if payment is successful
    if (paystackData.status === 'success') {
      console.log('[VERIFY] Payment successful, updating database...');
      
      await client.query(
        `UPDATE payment_transactions
         SET status = 'verified', 
             verified_at = NOW(),
             metadata = COALESCE(metadata, '{}'::jsonb) || $1
         WHERE reference = $2`,
        [JSON.stringify({ verified_via: 'client_polling' }), reference]
      );

      await client.query('COMMIT');
      console.log('[VERIFY] Database update complete');
      
      return res.json({ 
        success: true, 
        paid: true,
        message: 'Payment verified. Awaiting webhook for activation.'
      });
    }

    console.log('[VERIFY] Payment not yet successful, current status:', paystackData.status);
    await client.query('ROLLBACK');
    return res.json({ 
      success: true, 
      paid: false,
      status: paystackData.status,
      message: 'Payment not yet completed'
    });

  } catch (error) {
    console.error('[VERIFY] Error during verification:', error);
    await client.query('ROLLBACK');
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

/* =======================
   Check Chat Access
======================= */

export const checkChatAccess = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ success: false });

  const r = await pool.query(
    `SELECT has_chat_access, access_expiry_date
     FROM users WHERE id = $1`,
    [userId]
  );

  if (!r.rows.length) return res.status(404).json({ success: false });

  const expired =
    r.rows[0].access_expiry_date &&
    new Date() > new Date(r.rows[0].access_expiry_date);

  res.json({
    success: true,
    hasAccess: r.rows[0].has_chat_access && !expired
  });
};

/* =======================
   Paystack Webhook
======================= */

export const handlePaystackWebhook = async (req: Request, res: Response) => {
  console.log('[WEBHOOK] Received webhook', JSON.stringify(req.body));

  // Skip signature verification in development
  if (process.env.NODE_ENV !== 'development') {
    // Verify signature in non-development environments
    const hash = crypto
      .createHmac('sha512', getPaystackSecret())
      .update((req as any).rawBody || '')
      .digest('hex');

    console.log('[WEBHOOK] Computed hash:', hash);
    console.log('[WEBHOOK] Header signature:', req.headers['x-paystack-signature']);

    if (hash !== req.headers['x-paystack-signature']) {
      console.error('[WEBHOOK] Invalid signature');
      return res.sendStatus(400);
    }
  } else {
    console.log('[WEBHOOK] Skipping signature verification in development mode');
  }

  const client = await pool.connect();
  try {
    const event = req.body;
    console.log('[WEBHOOK] Event type:', event.event);

    if (event.event !== 'charge.success') {
      console.log('[WEBHOOK] Not a charge.success event, ignoring');
      return res.sendStatus(200);
    }

    const { reference, amount } = event.data;
    console.log('[WEBHOOK] Processing reference:', reference, 'amount:', amount);

    await client.query('BEGIN');

    const txRes = await client.query(
      `SELECT user_id, status, metadata, amount
       FROM payment_transactions
       WHERE reference = $1 FOR UPDATE`,
      [reference]
    );

    if (!txRes.rows.length) {
      console.warn('[WEBHOOK] Transaction not found for reference:', reference);
      await client.query('ROLLBACK');
      return res.sendStatus(200);
    }

    const tx = txRes.rows[0];
    console.log('[WEBHOOK] Current transaction status:', tx.status, 'metadata:', tx.metadata);

    if (tx.status === 'success') {
      console.log('[WEBHOOK] Transaction already successful');
      await client.query('ROLLBACK');
      return res.sendStatus(200);
    }

    const expectedAmount = Math.round(Number(tx.amount) * 100);
    if (Math.abs(Number(amount) - expectedAmount) > 1) {
      console.error('[WEBHOOK] Amount mismatch', { expectedAmount, actualAmount: amount });
      await client.query('ROLLBACK');
      return res.sendStatus(400);
    }

    // Parse metadata safely
    let metadata: any = {};
    try {
      if (!tx.metadata) {
        metadata = {};
      } else if (typeof tx.metadata === 'string') {
        metadata = JSON.parse(tx.metadata);
      } else {
        // When `metadata` is json/jsonb, pg typically returns it as an object already
        metadata = tx.metadata;
      }

      // Prefer webhook metadata (if present) as the most up-to-date source
      const webhookMetadata = event?.data?.metadata;
      if (webhookMetadata && typeof webhookMetadata === 'object') {
        metadata = { ...metadata, ...webhookMetadata };
      }
    } catch (err) {
      console.error('[WEBHOOK] Failed to parse metadata', err);
      metadata = {};
    }

    const planType: PlanType = isValidPlanType(metadata.planType) ? metadata.planType : 'monthly';
    const expiryDate = new Date(Date.now() + PLAN_DURATION[planType]);
    console.log('[WEBHOOK] planType:', planType, 'expiryDate:', expiryDate);

    // Update transaction with all fields in a single query
    await client.query(
      `UPDATE payment_transactions
       SET status = 'success',
           paid_at = NOW(),
           verified_at = NOW(),
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{webhook_processed}',
             'true'::jsonb
           ) || jsonb_build_object('plan_type', $1::text)
       WHERE reference = $2`,
      [planType, reference]
    );

    // Update user's chat access
    await client.query(
      `UPDATE users
       SET has_chat_access = true,
           access_expiry_date = $1::timestamptz
       WHERE id = $2`,
      [expiryDate, tx.user_id]
    );
    
    console.log(`[WEBHOOK] Granted chat access to user ${tx.user_id} until ${expiryDate}`);

    await client.query('COMMIT');
    console.log('[WEBHOOK] Transaction successfully updated');
    res.sendStatus(200);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[WEBHOOK] Error processing webhook', e);
    res.sendStatus(500);
  } finally {
    client.release();
  }
};

