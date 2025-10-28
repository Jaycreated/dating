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
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
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
        payment_url: response.data.data.authorization_url  // Ensure this is set correctly
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
