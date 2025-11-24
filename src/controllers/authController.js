const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Helper function to handle both MySQL and PostgreSQL results
const getRows = (result) => {
  // PostgreSQL returns { rows: [...] }
  // MySQL returns [[...], metadata]
  return result.rows || result[0];
};

// Helper function to convert MySQL query to PostgreSQL
const convertQuery = (sql, params) => {
  const isPostgres = !!process.env.DATABASE_URL;
  
  if (isPostgres) {
    // Convert ? to $1, $2, $3, etc.
    let paramIndex = 1;
    const convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    return { sql: convertedSql, params };
  }
  
  return { sql, params };
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return errorResponse(res, 'Please provide username and password', 400);
    }

    // Check if user exists
    const { sql, params } = convertQuery(
      'SELECT * FROM users WHERE username = ? AND is_active = ?',
      [username, true]  // Use true instead of TRUE for PostgreSQL
    );
    
    const result = await db.query(sql, params);
    const users = getRows(result);

    if (users.length === 0) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("password=====", password);
    console.log("user.password=====", user.password);
    
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Remove password from response
    delete user.password;

    successResponse(res, {
      token,
      user
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 'Login failed', 500);
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, full_name, phone } = req.body;

    if (!username || !password) {
      return errorResponse(res, 'Username and password are required', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const { sql: insertSql, params: insertParams } = convertQuery(
      'INSERT INTO users (username, password, full_name, phone) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, full_name, phone]
    );

    const insertResult = await db.query(insertSql, insertParams);
    
    // Get the inserted user ID
    // PostgreSQL: insertResult.rows[0].id (if using RETURNING id)
    // MySQL: insertResult[0].insertId
    let userId;
    const isPostgres = !!process.env.DATABASE_URL;
    
    if (isPostgres) {
      // For PostgreSQL, we need to use RETURNING clause
      const { sql: pgInsertSql, params: pgInsertParams } = convertQuery(
        'INSERT INTO users (username, password, full_name, phone) VALUES (?, ?, ?, ?) RETURNING id',
        [username, hashedPassword, full_name, phone]
      );
      const pgResult = await db.query(pgInsertSql, pgInsertParams);
      userId = pgResult.rows[0].id;
    } else {
      userId = insertResult[0].insertId;
    }

    const { sql: selectSql, params: selectParams } = convertQuery(
      'SELECT id, username, full_name, phone, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );

    const selectResult = await db.query(selectSql, selectParams);
    const newUser = getRows(selectResult);

    successResponse(res, newUser[0], 'User created successfully', 201);
  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle duplicate entry errors for both databases
    if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
      return errorResponse(res, 'Username already exists', 400);
    }
    
    errorResponse(res, 'Failed to create user', 500);
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const { sql, params } = convertQuery(
      'SELECT id, username, full_name, phone, is_active, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    const result = await db.query(sql, params);
    const users = getRows(result);

    if (users.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, users[0], 'Profile retrieved successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    errorResponse(res, 'Failed to get profile', 500);
  }
};