const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://neondb_owner:npg_4DSTJuzG8NbK@ep-autumn-queen-adrfn54i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Read and execute the migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations/20231031_add_last_login_to_users.sql'), 
      'utf8'
    );
    
    await client.query(migrationSQL);
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
