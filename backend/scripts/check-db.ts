import { pool } from '../src/config/database';

async function checkDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking database connection...');
    
    // Check connection
    const res = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    console.log('📅 Current database time:', res.rows[0].now);
    
    // Check if users table exists
    const tableCheck = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'"
    );
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Users table does not exist. Initializing database...');
      const { initializeDatabase } = await import('../src/config/database');
      await initializeDatabase();
      console.log('✅ Database initialized successfully');
    } else {
      console.log('✅ Users table exists');
    }
    
    // Check if payment columns exist
    const columnsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('has_chat_access', 'payment_date', 'payment_reference')
    `);
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    const missingColumns = ['has_chat_access', 'payment_date', 'payment_reference']
      .filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('⚠️  Missing columns:', missingColumns.join(', '));
      console.log('Adding missing columns...');
      
      if (missingColumns.includes('has_chat_access')) {
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS has_chat_access BOOLEAN NOT NULL DEFAULT FALSE');
      }
      if (missingColumns.includes('payment_date')) {
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE');
      }
      if (missingColumns.includes('payment_reference')) {
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255)');
      }
      
      console.log('✅ Added missing columns');
    } else {
      console.log('✅ All payment columns exist');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

checkDatabase();
