const { Pool } = require('pg');

// Use DATABASE_URL from Fly.io if available
const connectionString = process.env.DATABASE_URL;

let pool;

if (connectionString) {
  // Production on Fly.io
  console.log('📡 Connecting to Fly.io PostgreSQL...');
  pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // Development local
  console.log('📡 Connecting to local PostgreSQL...');
  pool = new Pool({
    user: process.env.DB_USER || 'johnchihule',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'wabiz_db',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
  });
}

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    throw error;
  }
};

module.exports = { pool, connectDB };