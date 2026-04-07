-- Create subscriptions table for IAP tracking
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP NOT NULL,
  payment_reference VARCHAR(255),
  amount INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- IAP specific fields
  iap_platform VARCHAR(10) CHECK (iap_platform IN ('ios', 'android')),
  auto_renewal_status BOOLEAN DEFAULT FALSE,
  original_transaction_id VARCHAR(255), -- iOS original transaction ID
  purchase_token VARCHAR(500), -- Android purchase token
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_reference ON subscriptions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE subscriptions IS 'Stores user subscription data including IAP subscriptions';
COMMENT ON COLUMN subscriptions.iap_platform IS 'Platform of the IAP: ios or android';
COMMENT ON COLUMN subscriptions.original_transaction_id IS 'iOS original transaction ID for tracking renewals';
COMMENT ON COLUMN subscriptions.purchase_token IS 'Android purchase token for verification';
