-- Add sexual_orientation column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sexual_orientation VARCHAR(20);

-- Add looking_for to preferences JSONB column if it doesn't exist
-- This is a no-op if the column already exists or if the key already exists in the JSONB
UPDATE users 
SET preferences = jsonb_set(
  COALESCE(preferences, '{}'::jsonb), 
  '{looking_for}', 
  COALESCE(preferences->'looking_for', 'null'::jsonb)
)
WHERE preferences IS NOT NULL;

-- Set a default empty JSONB object for preferences if it's NULL
UPDATE users 
SET preferences = '{}'::jsonb 
WHERE preferences IS NULL;

-- Add a comment to the column for documentation
COMMENT ON COLUMN users.sexual_orientation IS 'User''s self-identified sexual orientation (straight, gay, lesbian, transgender)';

-- Add a comment to the preferences field about the looking_for key
COMMENT ON COLUMN users.preferences IS 'User preferences including looking_for (straight, gay, lesbian, transgender) and other preferences';
