// This file defines routes for the authentication functionality in the application
// It includes routes for user registration, login, and logout
// Register and Login routes are public and do not require authentication
// routes/auth.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const isAuthenticated = require('../middleware/auth');

// POST /api/auth/register - Register a new user
router.post('/register', authController.register);

// POST /api/auth/login - Login user 
router.post('/login', authController.login);

// POST /api/auth/logout - Logout user
router.post('/logout', authController.logout);

// GET /api/auth/me - Get current user info 
router.get('/me', isAuthenticated, authController.getCurrentUser);

// PUT /api/auth/update-profile - Update user profile
router.put('/update-profile', authController.updateProfile);

// PUT /api/auth/update-password - Update user password
router.put('/update-password', authController.updatePassword);


module.exports = router;