-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reference VARCHAR(100) UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'card',
    service_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Add comment to the table
COMMENT ON TABLE payment_transactions IS 'Stores payment transaction records for the application';

-- Add comments to columns
COMMENT ON COLUMN payment_transactions.user_id IS 'Reference to the user who made the payment';
COMMENT ON COLUMN payment_transactions.reference IS 'Unique payment reference from payment processor';
COMMENT ON COLUMN payment_transactions.amount IS 'Amount in kobo (smallest currency unit)';
COMMENT ON COLUMN payment_transactions.status IS 'Payment status (pending, success, failed)';
COMMENT ON COLUMN payment_transactions.payment_method IS 'Payment method used (card, bank_transfer, etc.)';
COMMENT ON COLUMN payment_transactions.service_type IS 'Type of service being paid for (chat_access, subscription, etc.)';
COMMENT ON COLUMN payment_transactions.metadata IS 'Additional payment metadata in JSON format';
