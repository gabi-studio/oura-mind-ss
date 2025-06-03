// This file defines routes for the authentication functionality in the application
// It includes routes for user registration, login, and logout
// Register and Login routes are public and do not require authentication

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - Register a new user
router.post('/register', authController.register);

// POST /api/auth/login - Login user
router.post('/login', authController.login);

// POST /api/auth/logout - Logout user
router.post('/logout', authController.logout);

module.exports = router;
