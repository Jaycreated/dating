import { Request, Response } from 'express';
import { pool } from '../config/database';
import * as crypto from 'crypto';
import {
  initializePayment,
  verifyTransaction,
  getPaystackSecret
} from '../services/paystack.service';
import { AppleIAPVerifier, legacyAppleVerification, AppleReceiptData } from '../services/apple-iap';
import { GooglePlayIAPVerifier, AndroidReceiptData } from '../services/google-play-iap';

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

// IAP Product ID to Plan mapping
const PRODUCT_ID_TO_PLAN: Record<string, PlanType> = {
  'com.pairfect.daily': 'daily',
  'com.pairfect.monthly': 'monthly',
  'com.pairfect.premium.daily': 'daily',
  'com.pairfect.premium.monthly': 'monthly',
};

const PRICE_MAP: Record<string, number> = {
  'com.pairfect.daily': 300,      // 300 NGN daily
  'com.pairfect.monthly': 3000,   // 3000 NGN monthly
  'com.pairfect.premium.daily': 300,
  'com.pairfect.premium.monthly': 3000,
};

/* Initialize IAP Verifiers (if env vars are set) */
let appleVerifier: AppleIAPVerifier | null = null;
let googleVerifier: GooglePlayIAPVerifier | null = null;

if (process.env.APPLE_PRIVATE_KEY && process.env.APPLE_KEY_ID) {
  appleVerifier = new AppleIAPVerifier(
    process.env.APPLE_PRIVATE_KEY,
    process.env.APPLE_KEY_ID,
    process.env.APPLE_ISSUER_ID || '',
    process.env.APPLE_BUNDLE_ID || 'com.anonymous.Pairfect'
  );
  console.log('✅ Apple IAP Verifier initialized');
}

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    googleVerifier = new GooglePlayIAPVerifier(
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.anonymous.Pairfect'
    );
    console.log('✅ Google Play IAP Verifier initialized');
  } catch (error) {
    console.error('Failed to initialize Google Play verifier:', error);
  }
} else if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
  try {
    googleVerifier = new GooglePlayIAPVerifier(
      '', // Empty path since using base64
      process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.anonymous.Pairfect'
    );
    console.log('✅ Google Play IAP Verifier initialized (base64)');
  } catch (error) {
    console.error('Failed to initialize Google Play verifier:', error);
  }
}

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

  const freeUsageRes = await pool.query(
    `SELECT free_messages_used
     FROM users WHERE id = $1`,
    [userId]
  );

  const FREE_MESSAGES_LIMIT = 3;
  const freeMessagesUsed = Number(freeUsageRes.rows[0]?.free_messages_used ?? 0);
  const freeMessagesRemaining = Math.max(0, FREE_MESSAGES_LIMIT - freeMessagesUsed);

  const hasSubscriptionAccess = r.rows[0].has_chat_access && !expired;
  const hasAccess = hasSubscriptionAccess || freeMessagesRemaining > 0;

  res.json({
    success: true,
    hasAccess,
    freeMessages: {
      limit: FREE_MESSAGES_LIMIT,
      used: freeMessagesUsed,
      remaining: freeMessagesRemaining
    }
  });
};

/* =======================
   Paystack Webhook
======================= */

export const handlePaymentCallback = async (req: Request, res: Response) => {
  try {
    const { reference } = req.query;

    console.log('[PAYMENT_CALLBACK] Reference:', reference);

    if (!reference || typeof reference !== 'string') {
      console.warn('[PAYMENT_CALLBACK] Missing reference');
      return res.redirect('pairfect://payment-failed');
    }

    // ✅ Always verify with Paystack
    const verification = await verifyTransaction(reference);

    if (
      verification?.success &&
      verification?.data?.status === 'success'
    ) {
      console.log('[PAYMENT_CALLBACK] Payment verified successfully');

      return res.redirect(
        `pairfect://payment-success?reference=${reference}`
      );
    }

    console.warn('[PAYMENT_CALLBACK] Verification failed:', verification?.data);
    return res.redirect('pairfect://payment-failed');

  } catch (error) {
    console.error('[PAYMENT_CALLBACK] Error:', error);
    return res.redirect('pairfect://payment-error');
  }
};


/**
 * Handle Paystack webhook events
 * This is called by Paystack for payment status updates
 */
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

/* =======================
   IAP Verification
======================= */

export const verifyIAP = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { receipt, productId, platform } = req.body;

    if (!receipt || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Missing receipt or platform',
      });
    }

    let verificationResult: any;

    if (platform === 'ios') {
      // iOS verification
      if (!appleVerifier) {
        // Fallback to legacy verification if App Store Server API not configured
        try {
          const appleData: AppleReceiptData = {
            transactionId: receipt.transactionId,
            receipt: receipt.receipt,
            productId: productId || receipt.productId,
          };
          verificationResult = await legacyAppleVerification(
            appleData.receipt,
            process.env.APPLE_SHARED_SECRET
          );
        } catch (error) {
          return res.status(503).json({
            success: false,
            message: 'Apple IAP verification not configured',
          });
        }
      } else {
        const appleData: AppleReceiptData = {
          transactionId: receipt.transactionId,
          receipt: receipt.receipt,
          productId: productId || receipt.productId,
        };
        verificationResult = await appleVerifier.verifyReceipt(appleData);
      }
    } else if (platform === 'android') {
      // Android verification
      if (!googleVerifier) {
        return res.status(503).json({
          success: false,
          message: 'Google Play IAP verification not configured',
        });
      }

      const androidData: AndroidReceiptData = {
        originalJson: receipt.originalJson,
        signature: receipt.signature,
        purchaseToken: receipt.purchaseToken,
        productId: productId || receipt.productId,
      };
      verificationResult = await googleVerifier.verifySubscription(androidData);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "ios" or "android"',
      });
    }

    if (!verificationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid receipt',
      });
    }

    await client.query('BEGIN');

    // Determine plan type from product ID
    const planId = PRODUCT_ID_TO_PLAN[verificationResult.productId] || 'monthly';
    const expiryDate = verificationResult.expiresDate || new Date(Date.now() + PLAN_DURATION[planId]);
    const amount = PRICE_MAP[verificationResult.productId] || 1000;
    const paymentReference = verificationResult.transactionId || verificationResult.purchaseToken;

    // Check if subscription already exists
    const existingSub = await client.query(
      `SELECT id, status, end_date FROM subscriptions 
       WHERE user_id = $1 AND payment_reference = $2`,
      [userId, paymentReference]
    );

    let subscriptionId: string;

    if (existingSub.rows.length === 0) {
      // Create new subscription
      const subResult = await client.query(
        `INSERT INTO subscriptions 
         (user_id, plan_id, status, start_date, end_date, payment_reference, 
          amount, currency, iap_platform, original_transaction_id, purchase_token, auto_renewal_status)
         VALUES ($1, $2, 'active', NOW(), $3, $4, $5, 'USD', $6, $7, $8, $9)
         RETURNING id`,
        [
          userId,
          planId,
          expiryDate,
          paymentReference,
          amount,
          platform,
          verificationResult.originalTransactionId || null,
          verificationResult.purchaseToken || null,
          verificationResult.isRenewable || verificationResult.autoRenewing || false,
        ]
      );
      subscriptionId = subResult.rows[0].id;
    } else {
      // Update existing subscription
      subscriptionId = existingSub.rows[0].id;
      await client.query(
        `UPDATE subscriptions 
         SET status = 'active', end_date = $1, updated_at = NOW()
         WHERE id = $2`,
        [expiryDate, subscriptionId]
      );
    }

    // Grant chat access
    await client.query(
      `UPDATE users
       SET has_chat_access = true,
           access_expiry_date = $1::timestamptz
       WHERE id = $2`,
      [expiryDate, userId]
    );

    // Log receipt for audit trail
    await client.query(
      `INSERT INTO iap_receipts 
       (user_id, subscription_id, product_id, platform, receipt_data, status, verified_at)
       VALUES ($1, $2, $3, $4, $5, 'verified', NOW())`,
      [
        userId,
        subscriptionId,
        verificationResult.productId,
        platform,
        JSON.stringify(receipt),
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      subscription: {
        id: subscriptionId,
        userId,
        planId,
        status: 'active',
        startDate: verificationResult.purchaseDate.toISOString(),
        endDate: expiryDate.toISOString(),
        paymentReference,
        amount,
        currency: 'USD',
      },
      message: 'Subscription verified and activated successfully',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('IAP verification error:', error);

    // Log failed receipt
    const failedUserId = (req as any).user?.id;
    const failedProductId = req.body.productId;
    const failedPlatform = req.body.platform;
    const failedReceipt = req.body.receipt;
    
    try {
      await client.query(
        `INSERT INTO iap_receipts 
         (user_id, product_id, platform, receipt_data, status, error_message)
         VALUES ($1, $2, $3, $4, 'failed', $5)`,
        [
          failedUserId,
          failedProductId,
          failedPlatform,
          JSON.stringify(failedReceipt),
          error.message,
        ]
      );
    } catch (logError) {
      console.error('Failed to log IAP receipt:', logError);
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Verification failed',
    });
  } finally {
    client.release();
  }
};

