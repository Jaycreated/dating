-- Add push_token column to users table for Expo push notifications
ALTER TABLE users ADD COLUMN push_token TEXT DEFAULT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN users.push_token IS 'Expo push notification token for sending push notifications when app is closed';
