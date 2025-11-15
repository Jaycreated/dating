-- Add location column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN users.location IS 'User''s location (city/area)';
