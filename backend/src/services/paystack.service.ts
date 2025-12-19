import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY is not defined in environment variables');
}

const paystack = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface DedicatedAccountResponse {
  status: boolean;
  message: string;
  data: {
    bank: {
      name: string;
      id: number;
      slug: string;
    };
    account_name: string;
    account_number: string;
    assigned: boolean;
    currency: string;
    metadata: any;
    active: boolean;
    id: number;
    created_at: string;
    updated_at: string;
    assignment: {
      integration: number;
      assignee_id: number;
      assignee_type: string;
      assigned_at: string;
      updated_at: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any;
      risk_action: string;
      international_format_phone: string | null;
    };
  };
}

export interface CreateDedicatedAccountResponse {
  success: boolean;
  data?: {
    account_number: string;
    bank: {
      name: string;
      id: number;
      slug: string;
    };
    account_name: string;
    reference: string;
    [key: string]: any;
  };
  error?: string;
}

export const initializePayment = async (
  email: string,
  amount: number,
  metadata: Record<string, any> = {}
) => {
  try {
    const reference = `chat_${uuidv4()}`;
    const response = await paystack.post('/transaction/initialize', {
      email,
      amount: amount * 100, // Convert to kobo
      reference,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      channels: ['bank_transfer', 'card'],
      metadata: {
        ...metadata,
        custom_fields: [
          {
            display_name: 'Chat Access Payment',
            variable_name: 'chat_access',
            value: 'true'
          }
        ]
      }
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to initialize payment');
    }

    return {
      success: true,
      data: {
        ...response.data.data,
        reference,
        payment_url: response.data.data.authorization_url,
        redirect_url: `${process.env.FRONTEND_URL}/payment/callback?reference=${reference}`
      }
    };
  } catch (error: any) {
    console.error('Error initializing payment:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to initialize payment'
    };
  }
};

export const verifyTransaction = async (reference: string) => {
  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    return {
      success: response.data.status,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error verifying transaction:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to verify transaction'
    };
  }
};

export interface CustomerData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface CreateCustomerResponse {
  success: boolean;
  data?: {
    id: number;
    customer_code: string;
    email: string;
    [key: string]: any;
  };
  error?: string;
}

export interface SubscriptionPlanData {
  name: string;
  amount: number; // in kobo
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually';
  description?: string;
  send_invoices?: boolean;
  send_sms?: boolean;
  currency?: string;
  invoice_limit?: number;
}

export interface SubscriptionData {
  customer: string; // Customer's email or code
  plan: string; // Plan code
  authorization: string; // Authorization code
  start_date?: string; // ISO 8601 format
}

export const createCustomer = async (customerData: CustomerData): Promise<CreateCustomerResponse> => {
  try {
    const response = await paystack.post('/customer', customerData);
    return {
      success: response.data.status,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error creating customer:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create customer'
    };
  }
};

export const createSubscriptionPlan = async (planData: SubscriptionPlanData) => {
  try {
    const response = await paystack.post('/plan', {
      ...planData,
      amount: planData.amount * 100, // Convert to kobo
      currency: planData.currency || 'NGN',
      send_invoices: planData.send_invoices !== false,
      send_sms: planData.send_sms || false,
    });

    return {
      success: response.data.status,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error creating subscription plan:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create subscription plan'
    };
  }
};

export const createSubscription = async (subscriptionData: SubscriptionData) => {
  try {
    const response = await paystack.post('/subscription', subscriptionData);
    return {
      success: response.data.status,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error creating subscription:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create subscription'
    };
  }
};

export const getSubscription = async (subscriptionId: string | number) => {
  try {
    const response = await paystack.get(`/subscription/${subscriptionId}`);
    return {
      success: response.data.status,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error fetching subscription:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch subscription'
    };
  }
};

export const updateSubscription = async (subscriptionId: string | number, data: { code?: string; token?: string }) => {
  try {
    const response = await paystack.put(`/subscription/${subscriptionId}`, data);
    return {
      success: response.data.status,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error updating subscription:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update subscription'
    };
  }
};

export const cancelSubscription = async (subscriptionId: string | number) => {
  try {
    const response = await paystack.post(`/subscription/disable`, {
      code: subscriptionId,
      token: 'dummy-token' // This is required by Paystack but not used
    });
    
    return {
      success: response.data.status,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error canceling subscription:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to cancel subscription'
    };
  }
};

export const listSubscriptions = async (params: {
  perPage?: number;
  page?: number;
  customer?: string;
  plan?: string;
  status?: 'active' | 'cancelled' | 'expired';
}) => {
  try {
    const response = await paystack.get('/subscription', { params });
    return {
      success: response.data.status,
      data: response.data.data,
      meta: response.data.meta
    };
  } catch (error: any) {
    console.error('Error listing subscriptions:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to list subscriptions'
    };
  }
};

/**
 * Verifies that a webhook event is actually from Paystack
 * @param req - The Express request object
 * @returns boolean - True if the webhook is valid, false otherwise
 */
export const verifyWebhook = (req: any): boolean => {
  try {
    const crypto = require('crypto');
    const signature = req.headers['x-paystack-signature'] as string;
    
    if (!signature || !process.env.PAYSTACK_WEBHOOK_SECRET) {
      console.error('Webhook verification failed: Missing signature or webhook secret');
      return false;
    }
    
    // Get the raw request body as a string
    const requestBody = JSON.stringify(req.body);
    
    // Create a hash using the webhook secret
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
      .update(requestBody)
      .digest('hex');
    
    // Compare the computed hash with the signature from Paystack
    return hash === signature;
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return false;
  }
};

export interface WebhookEvent<T = any> {
  event: string;
  data: T;
}

export interface SubscriptionWebhookData {
  id: number;
  domain: string;
  status: string;
  amount: number;
  subscription_code: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    customer_code: string;
    phone: string | null;
  };
  plan: {
    id: number;
    name: string;
    plan_code: string;
    amount: number;
    interval: string;
  };
  next_payment_date: string | null;
  paystack_customer_id: string;
}
