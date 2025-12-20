import { Pool } from 'pg';

// Debug: Log which connection method is being used
if (process.env.DATABASE_URL) {
  console.log('📊 Using DATABASE_URL for connection');
  console.log('🔗 Database host:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0]);
} else {
  console.log('📊 Using individual DB settings for connection');
}

// Use DATABASE_URL if provided, otherwise use individual settings
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Changed to false for development, set to true in production with proper CA
      },
      max: 5, // Reduced max connections to avoid overloading
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 40000, // Increased to 40 seconds
      query_timeout: 15000, // Add query timeout
      statement_timeout: 15000, // Add statement timeout
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'dating_app',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
      keepAlive: true,
    };

console.log('📊 Database connection config:', {
  ...poolConfig,
  password: poolConfig.password ? '***' : 'not set',
  connectionString: poolConfig.connectionString ? '***' : 'not set'
});

const pool = new Pool(poolConfig);

// Initialize database tables
export const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        age INTEGER,
        gender VARCHAR(50),
        bio TEXT,
        location VARCHAR(255),
        photos JSONB DEFAULT '[]',
        interests JSONB DEFAULT '[]',
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Matches table (stores likes and passes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        target_user_id INTEGER NOT NULL,
        action VARCHAR(10) NOT NULL CHECK(action IN ('like', 'pass')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, target_user_id)
      )
    `);

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        from_user_id INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
      CREATE INDEX IF NOT EXISTS idx_matches_target_user_id ON matches(target_user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
    `);

    // Orders table for idempotent order creation
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `);

    // Payment transactions table (extended with order mapping and provider id)
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id VARCHAR(100) REFERENCES orders(id),
        reference VARCHAR(100) UNIQUE NOT NULL,
        provider_transaction_id VARCHAR(100),
        amount INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'card',
        service_type VARCHAR(50) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure new columns exist when upgrading an existing schema
    await client.query(`
      ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS order_id VARCHAR(100) REFERENCES orders(id);
    `);

    await client.query(`
      ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS provider_transaction_id VARCHAR(100);
    `);

    // Create indexes for payment transactions (safe on upgrades)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(reference);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
    `);
    
    // Only create order_id index if column exists
    const colRes = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'order_id'`
    );
    if (colRes.rows.length > 0) {
      await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);`);
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Export the pool for direct use
export { pool };