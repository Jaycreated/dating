require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  console.log('💡 Tip: Create a .env file in the root directory with your database connection string');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: true }
    : { rejectUnauthorized: false },
  max: 2, // Limit connections for this utility script
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

async function countUsers() {
  console.log('🔍 Checking database connection...');
  console.log(`📊 Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}`);
  
  const client = await pool.connect().catch(err => {
    console.error('❌ Failed to connect to the database:', err.message);
    process.exit(1);
  });

  try {
    // Count all users
    const countRes = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(countRes.rows[0].count, 10);
    console.log(`✅ Total users: ${userCount}`);
    
    if (userCount > 0) {
      // Get sample user data
      const userRes = await client.query(
        'SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'
      );
      console.log('\n📋 Latest users:');
      console.table(userRes.rows);
    } else {
      console.log('ℹ️  No users found in the database');
    }
  } catch (err) {
    console.error('❌ Database error:', err.message);
    if (err.code) console.log(`Error code: ${err.code}`);
  } finally {
    client.release();
    await pool.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run the function
countUsers().catch(console.error);
