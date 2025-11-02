import { Pool } from 'pg';

// Use the provided database URL
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_4DSTJuzG8NbK@ep-autumn-queen-adrfn54i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: true
  }
});

async function testConnection() {
  const client = await pool.connect();
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const res = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    console.log('📅 Current database time:', res.rows[0].now);
    
    // Check if users table exists
    const tableCheck = await client.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = 'users'`
    );
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Users table does not exist. Creating tables...');
      await createTables(client);
    } else {
      console.log('✅ Users table exists');
      await checkAndAddColumns(client);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    client.release();
    await pool.end();
    console.log('\n✅ Database check completed');
  }
}

async function createTables(client: any) {
  try {
    await client.query(`
      CREATE TABLE users (
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
        has_chat_access BOOLEAN DEFAULT FALSE,
        payment_date TIMESTAMP WITH TIME ZONE,
        payment_reference VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE matches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        target_user_id INTEGER NOT NULL,
        action VARCHAR(10) NOT NULL CHECK(action IN ('like', 'pass')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, target_user_id)
      );
      
      CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX idx_matches_user_id ON matches(user_id);
      CREATE INDEX idx_matches_target_user_id ON matches(target_user_id);
      CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
      CREATE INDEX idx_users_has_chat_access ON users(has_chat_access);
      CREATE INDEX idx_users_payment_reference ON users(payment_reference);
    `);
    
    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

async function checkAndAddColumns(client: any) {
  try {
    // Check if payment columns exist
    const columnsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('has_chat_access', 'payment_date', 'payment_reference')
    `);
    
    const existingColumns = columnsCheck.rows.map((row: any) => row.column_name);
    const missingColumns = ['has_chat_access', 'payment_date', 'payment_reference']
      .filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('⚠️  Adding missing columns:', missingColumns.join(', '));
      
      if (missingColumns.includes('has_chat_access')) {
        await client.query('ALTER TABLE users ADD COLUMN has_chat_access BOOLEAN NOT NULL DEFAULT FALSE');
      }
      if (missingColumns.includes('payment_date')) {
        await client.query('ALTER TABLE users ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE');
      }
      if (missingColumns.includes('payment_reference')) {
        await client.query('ALTER TABLE users ADD COLUMN payment_reference VARCHAR(255)');
      }
      
      console.log('✅ Added missing columns');
    } else {
      console.log('✅ All required columns exist');
    }
  } catch (error) {
    console.error('❌ Error checking/adding columns:', error);
    throw error;
  }
}

testConnection();
