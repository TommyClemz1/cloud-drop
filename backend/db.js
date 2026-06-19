const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }, // RDS requires SSL connections by default
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
