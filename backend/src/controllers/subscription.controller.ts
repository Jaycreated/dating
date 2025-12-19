import { Request, Response } from 'express';
import { 
  createCustomer,
  createSubscription as createPaystackSubscription,
  createSubscriptionPlan as createPaystackPlan,
  cancelSubscription as cancelPaystackSubscription,
  verifyWebhook,
  WebhookEvent
} from '../services/paystack.service';
import { pool } from '../config/database';
import SubscriptionModel from '../models/Subscription';
import { CancelSubscriptionInput } from '../types';
import { 
  CreateSubscriptionInput, 
  Subscription, 
  SubscriptionPlan,
  UpdateSubscriptionInput
} from '../types';

// Create a new subscription plan (Admin only)
export const createSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      name,
      description,
      amount,
      interval,
      features
    } = req.body;

    // Validate required fields
    if (!name || !amount || !interval) {
      return res.status(400).json({
        success: false,
        error: 'Name, amount, and interval are required'
      });
    }

    // Create plan in Paystack
    const paystackPlan = await createPaystackPlan({
      name,
      description,
      amount: amount * 100, // Convert to kobo
      interval,
      currency: 'NGN',
      send_invoices: true,
      send_sms: false
    });

    if (!paystackPlan.success || !paystackPlan.data) {
      return res.status(400).json({
        success: false,
        error: paystackPlan.error || 'Failed to create subscription plan'
      });
    }

    // Save plan to database
    const result = await pool.query(
      `INSERT INTO subscription_plans (
        name, 
        description, 
        amount, 
        interval, 
        currency, 
        paystack_plan_code,
        features,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *`,
      [
        name,
        description,
        amount,
        interval,
        'NGN',
        paystackPlan.data.plan_code,
        JSON.stringify(features || {})
      ]
    );

    const plan = result.rows[0];
    
    res.status(201).json({
      success: true,
      data: {
        ...plan,
        features: plan.features ? JSON.parse(plan.features) : {}
      }
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create subscription plan' 
    });
  }
};

// Get all active subscription plans
export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscription_plans WHERE is_active = true'
    );

    const plans = result.rows.map(plan => ({
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : {}
    }));

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch subscription plans' 
    });
  }
};

// Create a new subscription
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { planId, authorizationCode } = req.body;

    if (!planId || !authorizationCode) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID and authorization code are required'
      });
    }

    // Get user details
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, paystack_customer_code FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = userResult.rows[0];
    let customerCode = user.paystack_customer_code;

    // Create customer in Paystack if not exists
    if (!customerCode) {
      const customerData = {
        email: user.email,
        first_name: user.first_name || 'User',
        last_name: user.last_name || String(user.id),
        phone: user.phone
      };

      const customerResult = await createCustomer(customerData);
      
      if (!customerResult.success || !customerResult.data) {
        return res.status(400).json({
          success: false,
          error: customerResult.error || 'Failed to create customer'
        });
      }

      customerCode = customerResult.data.customer_code;
      
      // Save customer code to user
      await pool.query(
        'UPDATE users SET paystack_customer_code = $1 WHERE id = $2',
        [customerCode, userId]
      );
    }

    // Get plan details
    const planResult = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
      [planId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subscription plan not found or inactive' 
      });
    }

    const plan = planResult.rows[0];

    // Create subscription in Paystack
    const subscriptionResult = await createPaystackSubscription({
      customer: customerCode,
      plan: plan.paystack_plan_code,
      authorization: authorizationCode
    });

    if (!subscriptionResult.success || !subscriptionResult.data) {
      return res.status(400).json({
        success: false,
        error: subscriptionResult.error || 'Failed to create subscription'
      });
    }

    // Save subscription to database
    const subscriptionInput: CreateSubscriptionInput = {
      userId,
      planId: plan.id,
      paystackCustomerCode: customerCode,
      paystackAuthorizationCode: authorizationCode,
      metadata: {
        paystack_subscription_code: subscriptionResult.data.subscription_code
      }
    };

    const subscription = await SubscriptionModel.create(subscriptionInput);

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create subscription' 
    });
  }
};

// Get current user's active subscription
export const getMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const subscription = await SubscriptionModel.findByUserId(userId);
    
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        error: 'No active subscription found' 
      });
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch subscription' 
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { cancelAtPeriodEnd = true } = req.body;
    
    // Get user's active subscription
    const subscription = await SubscriptionModel.findByUserId(userId);
    
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        error: 'No active subscription found' 
      });
    }

    // Cancel in Paystack
    if (!subscription.paystack_subscription_code) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription'
      });
    }

    const cancelResult = await cancelPaystackSubscription(
      subscription.paystack_subscription_code
    );

    if (!cancelResult.success) {
      return res.status(400).json({
        success: false,
        error: cancelResult.error || 'Failed to cancel subscription'
      });
    }

    // Update subscription in database
    const input: CancelSubscriptionInput = { cancelAtPeriodEnd };
    const updatedSubscription = await SubscriptionModel.cancel(subscription.id, input);

    res.json({ 
      success: true, 
      data: updatedSubscription,
      message: cancelAtPeriodEnd 
        ? 'Subscription will be cancelled at the end of the billing period' 
        : 'Subscription has been cancelled immediately'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel subscription' 
    });
  }
};
// Webhook handler for Paystack subscription events
export const handleSubscriptionWebhook = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    // Development mode - skip signature verification
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  Running in development mode - skipping webhook signature verification');
    } 
    // Production mode - verify webhook secret is set
    else if (!process.env.PAYSTACK_WEBHOOK_SECRET) {
      console.error('PAYSTACK_WEBHOOK_SECRET is not set');
      return res.status(500).json({ status: 'error', message: 'Server configuration error' });
    }
    // Production mode - verify signature
    else {
      const isValidWebhook = verifyWebhook(req);
      if (!isValidWebhook) {
        console.warn('Invalid webhook signature:', req.headers['x-paystack-signature']);
        return res.status(401).json({ status: 'error', message: 'Invalid signature' });
      }
    }

    const payload = req.body as WebhookEvent<any>;
    const { event, data } = payload;

    console.log(`Processing Paystack webhook event: ${event}`);

    switch (event) {
      case 'subscription.create':
      case 'subscription.enable':
      case 'subscription.disable':
      case 'subscription.not_renew': {
        const subscription = await SubscriptionModel.findByPaystackCode(data.subscription_code);
        if (subscription) {
          await SubscriptionModel.updateStatusFromWebhook(
            data.subscription_code,
            data.status.toLowerCase(),
            data.next_payment_date
          );
        }
        break;
      }
      
      case 'invoice.create':
      case 'invoice.update':
      case 'invoice.payment_failed': {
        // Handle invoice events if needed
        console.log('Invoice event received:', event, data);
        break;
      }

      case 'charge.success': {
        // Handle charge.success for chat access
        const reference = data.reference;
        
        if (!reference) {
          console.warn('⚠️ Webhook charge.success received without reference');
          break;
        }

        await client.query('BEGIN');
        
        // Get transaction details
        const txResult = await client.query(
          `SELECT user_id, status, metadata, amount
           FROM payment_transactions 
           WHERE reference = $1 
           FOR UPDATE`,
          [reference]
        );
        
        if (txResult.rows.length === 0) {
          console.warn(`⚠️ Transaction not found for reference: ${reference}`);
          await client.query('ROLLBACK');
          break;
        }
        
        const transaction = txResult.rows[0];
        const userId = transaction.user_id;
        
        // Only process if not already successful
        if (transaction.status === 'success') {
          console.log(`ℹ️ Transaction ${reference} already processed`);
          await client.query('ROLLBACK');
          break;
        }
        
        const metadata = transaction.metadata || {};
        const planType = metadata.planType || 'monthly';
        
        // Calculate expiry date based on plan type
        let expiryDate = new Date();
        if (planType === 'daily') {
          expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        } else if (planType === 'monthly') {
          expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        }
        
        // CRITICAL FIX: Update transaction status to 'success'
        await client.query(
          `UPDATE payment_transactions 
           SET status = 'success', 
               updated_at = NOW(), 
               paid_at = NOW()
           WHERE reference = $1`,
          [reference]
        );
        
        console.log(`✅ Updated transaction ${reference} to 'success' status`);
        
        // Update user's chat access with expiry
        await client.query(
          `UPDATE users 
           SET has_chat_access = true, 
               payment_date = NOW(),
               access_expiry_date = $1,
               payment_reference = $2 
           WHERE id = $3`,
          [expiryDate, reference, userId]
        );
        
        await client.query('COMMIT');
        
        console.log(`✅ Chat access granted to user ${userId} via webhook`);
        console.log(`✅ Plan: ${planType}, Expires: ${expiryDate.toISOString()}`);
        
        break;
      }
      
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
  } finally {
    client.release();
  }
};
