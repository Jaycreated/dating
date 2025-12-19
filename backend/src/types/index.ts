export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  age?: number;
  gender?: string;
  bio?: string;
  location?: string;
  photos?: string | string[]; // Can be a JSON string or an array
  interests?: string; // JSON string array
  preferences?: string | UserPreferences; // Can be a JSON string or object
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  minAge?: number;
  maxAge?: number;
  gender?: string;
  sexual_orientation?: 'straight' | 'gay' | 'lesbian' | 'transgender';
  looking_for?: 'straight' | 'gay' | 'lesbian' | 'transgender';
  maxDistance?: number;
}

export interface Match {
  id: number;
  user_id: number;
  target_user_id: number;
  action: 'like' | 'pass';
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  read_at?: string;
  created_at: string;
}

export interface AuthRequest extends Request {
  userId?: number;
}
export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string | null;
  amount: number; // in kobo
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually';
  interval_count?: number; // Number of intervals between each subscription billing
  currency: string;
  features: Record<string, any>;
  is_active: boolean;
  paystack_plan_code?: string; // Paystack's plan code
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  paystack_subscription_code: string;
  paystack_customer_code: string;
  paystack_authorization_code?: string; // Paystack authorization code for the subscription
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  // Joined fields (not in database)
  plan?: SubscriptionPlan;
}

export interface CreateSubscriptionInput {
  userId: number;
  planId: number;
  paystackCustomerCode: string;
  paystackAuthorizationCode: string;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionInput {
  status?: 'active' | 'cancelled' | 'expired' | 'past_due';
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, any>;
}

export interface CancelSubscriptionInput {
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    amount: number;
    subscription_code: string;
    email_token: string;
    authorization: {
      authorization_code: string;
      card_type: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      bin: string;
      bank: string;
      channel: string;
      signature: string;
      reusable: boolean;
      country_code: string;
      account_name: string;
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
    };
    plan: {
      id: number;
      name: string;
      plan_code: string;
      description: string | null;
      amount: number;
      interval: string;
      send_invoices: boolean;
      send_sms: boolean;
      currency: string;
    };
    first_payment_date: string;
    next_payment_date: string;
    paystack_customer_id: string;
  };
}
