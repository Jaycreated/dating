-- Table for storing web push subscriptions
CREATE TABLE IF NOT EXISTS web_push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_web_push_subscriptions_user_id ON web_push_subscriptions(user_id);

COMMENT ON TABLE web_push_subscriptions IS 'Stores web push notification subscriptions for browser-based notifications';
