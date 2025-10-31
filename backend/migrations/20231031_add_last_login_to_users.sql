-- Add last_login column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Comment explaining the purpose of the migration
COMMENT ON COLUMN users.last_login IS 'Stores the timestamp of the user\'s last successful login';

-- Update existing users to have a default last_login value of now()
-- This ensures existing users won't be treated as first-time users
UPDATE users 
SET last_login = NOW() 
WHERE last_login IS NULL;
