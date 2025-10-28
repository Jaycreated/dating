-- Add has_chat_access column to users table
ALTER TABLE users 
ADD COLUMN has_chat_access BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX idx_users_has_chat_access ON users(has_chat_access);
