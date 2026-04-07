-- Create iap_receipts table for audit trail
CREATE TABLE IF NOT EXISTS iap_receipts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
  product_id VARCHAR(255) NOT NULL,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  receipt_data JSONB NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('verified', 'failed', 'pending')),
  error_message TEXT,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_iap_receipts_user_id ON iap_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_iap_receipts_subscription_id ON iap_receipts(subscription_id);
CREATE INDEX IF NOT EXISTS idx_iap_receipts_product_id ON iap_receipts(product_id);
CREATE INDEX IF NOT EXISTS idx_iap_receipts_status ON iap_receipts(status);
CREATE INDEX IF NOT EXISTS idx_iap_receipts_created_at ON iap_receipts(created_at);

COMMENT ON TABLE iap_receipts IS 'Audit trail for all IAP receipt verification attempts';
COMMENT ON COLUMN iap_receipts.receipt_data IS 'Full receipt data from the mobile app';
COMMENT ON COLUMN iap_receipts.status IS 'Verification status: verified, failed, or pending';
