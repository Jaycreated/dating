import { Request, Response } from 'express';
import { pool } from '../config/database';
import { createAndroidPublisher } from '../config/google-auth';

interface GoogleReceipt {
  packageName: string;
  productId: string;
  purchaseToken: string;
}

// Verify IAP receipt with Google Play or Apple App Store
// Expected body: { provider: 'apple' | 'google', receipt: object, productId?: string }
export const verifyIAP = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { provider, receipt, productId } = req.body;
    if (!provider || !receipt) {
      return res.status(400).json({ success: false, error: 'provider and receipt are required' });
    }

    await client.query('BEGIN');

    const reference = `iap_${Date.now()}_${userId}`;

    // Insert pending transaction
    await client.query(
      `INSERT INTO payment_transactions (user_id, reference, amount, status, payment_method, service_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, reference, 0, 'pending', 'iap', 'chat_access', JSON.stringify({ provider, receipt, productId })]
    );

    let verificationResult: any;
    let status = 'failed';

    // Verify with Google Play
    if (provider === 'google') {
      const googleReceipt = receipt as GoogleReceipt;

      if (!googleReceipt.packageName || !googleReceipt.purchaseToken) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Invalid Google receipt format' });
      }

      try {
        const androidPublisher = createAndroidPublisher();

        const response = await androidPublisher.purchases.subscriptions.get({
          packageName: googleReceipt.packageName,
          subscriptionId: productId || googleReceipt.productId,
          token: googleReceipt.purchaseToken
        });

        verificationResult = response.data;

        // Check if subscription is active
        const isActive = response.data.paymentState === 1; // 1 = Payment received

        if (isActive) {
          status = 'completed';

          // Grant chat access
          await client.query(
            `INSERT INTO user_chat_access (user_id, chat_access_expires_at, source, reference)
             VALUES ($1, NOW() + INTERVAL '30 days', 'iap', $2)
             ON CONFLICT (user_id)
             DO UPDATE SET
               chat_access_expires_at = CASE
                 WHEN user_chat_access.chat_access_expires_at > NOW()
                 THEN user_chat_access.chat_access_expires_at + INTERVAL '30 days'
                 ELSE NOW() + INTERVAL '30 days'
               END,
               source = 'iap',
               reference = $2`,
            [userId, reference]
          );
        }

      } catch (error: any) {
        console.error('Google Play verification error:', error.message);
        verificationResult = { error: error.message };
      }
    }

    // Apple verification would go here...
    if (provider === 'apple') {
      // TODO: Implement Apple App Store verification
      verificationResult = { note: 'Apple verification not yet implemented' };
    }

    // Update transaction with verification result
    await client.query(
      `UPDATE payment_transactions
       SET status = $1, metadata = $2
       WHERE reference = $3`,
      [status, JSON.stringify({ provider, receipt, productId, verificationResult }), reference]
    );

    await client.query('COMMIT');

    res.json({
      success: status === 'completed',
      message: status === 'completed' ? 'Purchase verified and access granted' : 'Verification failed',
      data: { reference, status, provider, verificationResult }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error verifying IAP receipt:', error);
    res.status(500).json({ success: false, error: 'Failed to process receipt' });
  } finally {
    client.release();
  }
};

export default verifyIAP;
