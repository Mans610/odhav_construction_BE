const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return errorResponse(res, 'Please provide username and password', 400);
    }

    // Check if user exists
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (users.length === 0) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("password=====",password);
    console.log("password=====",user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
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

    const [result] = await db.query(
      'INSERT INTO users (username, password, full_name, phone) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, full_name, phone]
    );

    const [newUser] = await db.query(
      'SELECT id, username, full_name, phone, is_active, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    successResponse(res, newUser[0], 'User created successfully', 201);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, 'Username already exists', 400);
    }
    errorResponse(res, 'Failed to create user', 500);
  }
};
// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, full_name, phone, is_active, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, users[0], 'Profile retrieved successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    errorResponse(res, 'Failed to get profile', 500);
  }
};
