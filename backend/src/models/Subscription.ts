import { pool } from '../config/database';
import { 
  Subscription, 
  SubscriptionPlan, 
  CreateSubscriptionInput, 
  UpdateSubscriptionInput,
  CancelSubscriptionInput
} from '../types';

export class SubscriptionModel {
  // Create a new subscription
  static async create(input: CreateSubscriptionInput): Promise<Subscription> {
    const { userId, planId, paystackCustomerCode, metadata } = input;
    
    const result = await pool.query(
      `INSERT INTO subscriptions (
        user_id, 
        plan_id, 
        paystack_subscription_code, 
        paystack_customer_code,
        status,
        current_period_start,
        current_period_end,
        metadata
      ) 
      VALUES ($1, $2, $3, $4, 'active', NOW(), NOW() + INTERVAL '1 month', $5)
      RETURNING *`,
      [
        userId, 
        planId, 
        `sub_${Date.now()}_${userId}`, // Temporary code, will be updated by webhook
        paystackCustomerCode,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    return result.rows[0];
  }

  // Find subscription by ID
  static async findById(id: number): Promise<Subscription | null> {
    const result = await pool.query(
      `SELECT 
        s.id,
        s.user_id,
        s.plan_id,
        s.paystack_subscription_code,
        s.paystack_customer_code,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end,
        s.cancelled_at,
        s.metadata,
        s.created_at,
        s.updated_at,
        p.id as plan_table_id,
        p.name,
        p.description,
        p.amount,
        p.interval,
        p.interval_count,
        p.currency,
        p.features,
        p.is_active,
        p.plan_id as paystack_plan_code,
        p.created_at as plan_created_at,
        p.updated_at as plan_updated_at
       FROM subscriptions s
       LEFT JOIN subscription_plans p ON s.plan_id = p.id
       WHERE s.id = $1`,
      [id]
    );
    
    if (!result.rows[0]) return null;
    
    return this.mapSubscriptionWithPlan(result.rows[0]);
  }

  // Find active subscription by user ID
  static async findByUserId(userId: number): Promise<Subscription | null> {
    const result = await pool.query(
      `SELECT 
        s.id,
        s.user_id,
        s.plan_id,
        s.paystack_subscription_code,
        s.paystack_customer_code,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end,
        s.cancelled_at,
        s.metadata,
        s.created_at,
        s.updated_at,
        p.id as plan_table_id,
        p.name,
        p.description,
        p.amount,
        p.interval,
        p.interval_count,
        p.currency,
        p.features,
        p.is_active,
        p.plan_id as paystack_plan_code,
        p.created_at as plan_created_at,
        p.updated_at as plan_updated_at
       FROM subscriptions s
       LEFT JOIN subscription_plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 
       AND s.status = 'active'
       ORDER BY s.current_period_end DESC
       LIMIT 1`,
      [userId]
    );
    
    if (!result.rows[0]) return null;
    
    return this.mapSubscriptionWithPlan(result.rows[0]);
  }

  // Update subscription
  static async update(
    id: number, 
    updates: UpdateSubscriptionInput
  ): Promise<Subscription | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Add status update if provided
    if (updates.status) {
      fields.push(`status = $${paramCount}`);
      values.push(updates.status);
      paramCount++;
    }

    // Handle cancel_at_period_end
    if (updates.cancelAtPeriodEnd !== undefined) {
      fields.push(`cancel_at_period_end = $${paramCount}`);
      values.push(updates.cancelAtPeriodEnd);
      paramCount++;
      
      if (updates.cancelAtPeriodEnd) {
        fields.push(`cancelled_at = NOW()`);
      } else {
        fields.push(`cancelled_at = NULL`);
      }
    }

    // Handle metadata update
    if (updates.metadata) {
      fields.push(`metadata = $${paramCount}`);
      values.push(JSON.stringify(updates.metadata));
      paramCount++;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE subscriptions 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] ? this.findById(id) : null;
  }

  // Cancel subscription
  static async cancel(id: number, input: CancelSubscriptionInput): Promise<Subscription | null> {
    const updates: UpdateSubscriptionInput = {
      status: input.cancelAtPeriodEnd ? 'active' : 'cancelled',
      cancelAtPeriodEnd: input.cancelAtPeriodEnd
    };
    
    if (input.cancelAtPeriodEnd === false) {
      updates.status = 'cancelled';
    }
    
    return this.update(id, updates);
  }

  // Update subscription status from webhook
  static async updateStatusFromWebhook(
    paystackSubscriptionCode: string, 
    status: 'active' | 'cancelled' | 'expired' | 'past_due',
    currentPeriodEnd?: string
  ): Promise<Subscription | null> {
    const result = await pool.query(
      `UPDATE subscriptions 
       SET status = $1,
           current_period_end = COALESCE($2, current_period_end),
           cancel_at_period_end = $3,
           cancelled_at = CASE WHEN $1 = 'cancelled' THEN COALESCE(cancelled_at, NOW()) ELSE cancelled_at END,
           updated_at = NOW()
       WHERE paystack_subscription_code = $4
       RETURNING *`,
      [
        status,
        currentPeriodEnd,
        status === 'cancelled',
        paystackSubscriptionCode
      ]
    );
    
    return result.rows[0] ? this.findById(result.rows[0].id) : null;
  }

  // Find subscription by Paystack code
  static async findByPaystackCode(code: string): Promise<Subscription | null> {
    const client = await pool.connect();
    try {
      console.log(`[findByPaystackCode] Looking up subscription with code: ${code}`);
      
      const query = {
        text: `
          SELECT 
            s.id,
            s.user_id,
            s.plan_id,
            s.paystack_subscription_code,
            s.paystack_customer_code,
            s.status,
            s.current_period_start,
            s.current_period_end,
            s.cancel_at_period_end,
            s.cancelled_at,
            s.metadata,
            s.created_at,
            s.updated_at,
            p.id as plan_table_id,
            p.name,
            p.description,
            p.amount,
            p.interval,
            p.interval_count,
            p.currency,
            p.features,
            p.is_active,
            p.plan_id as paystack_plan_code,
            p.created_at as plan_created_at,
            p.updated_at as plan_updated_at
          FROM subscriptions s
          LEFT JOIN subscription_plans p ON s.plan_id = p.id
          WHERE s.paystack_subscription_code = $1
        `,
        values: [code]
      };
      
      const result = await client.query(query);
      
      if (!result.rows[0]) {
        console.log(`[findByPaystackCode] No subscription found for code: ${code}`);
        return null;
      }
      
      console.log('[findByPaystackCode] Found subscription');
      return this.mapSubscriptionWithPlan(result.rows[0]);
    } catch (error) {
      const errorObj = error as Error & { code?: string; detail?: string; hint?: string };
      const errorDetails = {
        code,
        error: {
          message: errorObj.message || 'Unknown error',
          ...(errorObj.stack && { stack: errorObj.stack }),
          ...(errorObj.code && { code: errorObj.code }),
          ...(errorObj.detail && { detail: errorObj.detail }),
          ...(errorObj.hint && { hint: errorObj.hint })
        }
      };
      console.error('[findByPaystackCode] Error details:', errorDetails);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Helper to map subscription with plan data
  private static mapSubscriptionWithPlan(row: any): Subscription {
    return {
      id: row.id,
      user_id: row.user_id,
      plan_id: row.plan_id,
      paystack_subscription_code: row.paystack_subscription_code,
      paystack_customer_code: row.paystack_customer_code,
      status: row.status as Subscription['status'],
      current_period_start: row.current_period_start,
      current_period_end: row.current_period_end,
      cancel_at_period_end: row.cancel_at_period_end || false,
      cancelled_at: row.cancelled_at,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      plan: row.name ? {
        id: row.plan_table_id,
        name: row.name,
        description: row.description,
        amount: row.amount,
        interval: row.interval as SubscriptionPlan['interval'],
        interval_count: row.interval_count,
        currency: row.currency || 'NGN',
        features: row.features ? (typeof row.features === 'string' ? JSON.parse(row.features) : row.features) : {},
        is_active: row.is_active,
        paystack_plan_code: row.paystack_plan_code,
        created_at: row.plan_created_at,
        updated_at: row.plan_updated_at
      } : undefined
    };
  }
}

export default SubscriptionModel;