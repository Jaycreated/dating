-- Add payment-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_chat_access BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_has_chat_access ON users(has_chat_access);
CREATE INDEX IF NOT EXISTS idx_users_payment_reference ON users(payment_reference);
