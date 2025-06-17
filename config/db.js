const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

// Create a MySQL connection pool using environment variables
// Using a connection pool to manage multiple connections efficiently
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3308
});

module.exports = pool.promise();
