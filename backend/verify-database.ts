import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function verifyDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database tables...\n');

    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('📋 Tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    console.log('');

    // Check users table structure
    const usersColumnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    
    const usersColumns = await client.query(usersColumnsQuery);
    console.log('👤 Users table columns:');
    usersColumns.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });
    console.log('');

    // Count records
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const matchCount = await client.query('SELECT COUNT(*) FROM matches');
    const messageCount = await client.query('SELECT COUNT(*) FROM messages');
    
    console.log('📊 Record counts:');
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Matches: ${matchCount.rows[0].count}`);
    console.log(`   Messages: ${messageCount.rows[0].count}`);
    console.log('');

    console.log('✅ Database verification complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyDatabase();
