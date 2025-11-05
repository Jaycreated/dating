require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4DSTJuzG8NbK@ep-autumn-queen-adrfn54i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function countUsers() {
  try {
    const res = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`Total number of users: ${res.rows[0].count}`);
    
    // Get some sample user data (first 5 users)
    const userRes = await pool.query('SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5');
    console.log('\nLatest 5 users:');
    console.table(userRes.rows);
    
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

countUsers();
