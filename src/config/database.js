require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // PostgreSQL for production (Render)
  const { Pool } = require('pg');
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Test connection
  pool.query('SELECT NOW() as now', (err, res) => {
    if (err) {
      console.error('❌ PostgreSQL connection failed:', err.message);
    } else {
      console.log('✅ PostgreSQL connected successfully at:', res.rows[0].now);
    }
  });

  // Export query wrapper for PostgreSQL
  pool.queryWrapper = async (sql, params) => {
    const result = await pool.query(sql, params);
    return [result.rows]; // Return in MySQL format [rows]
  };

} else {
  // MySQL for local development
  const mysql = require('mysql2/promise');
  
  pool = mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'odhav_design_construction',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Test connection
  pool.getConnection()
    .then(connection => {
      console.log('✅ MySQL connected successfully');
      connection.release();
    })
    .catch(err => {
      console.error('❌ MySQL connection failed:', err.message);
    });

  // Export query wrapper for MySQL
  pool.queryWrapper = async (sql, params) => {
    return await pool.query(sql, params);
  };
}

module.exports = pool;