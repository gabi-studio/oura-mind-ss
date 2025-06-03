// controllers/authController.js
// This file defines the authentication controller for user registration, login, and logout
// It uses the authService to interacts with the database

const authService = require('../services/authService');

// Handle user registration
// Expects name, email, password, and role in the request body
// Role defaults to 'reflector' if not provided
// If successful, responds with a token and user info (I also defined this in the DB)
async function register(req, res) {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const role = req.body.role || 'reflector';

  // Validate User Input
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  // Use the authService to handle user registration
  
  try {
    const { user, token } = await authService.registerUser({ name, email, password, role });

    res
      .cookie('token', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      .status(201)
      .json({
        message: 'User registered successfully.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
}

// Handle user login
// Expects email and password in the request body
// If successful, responds with a token and user info
// If an error occurs, responds with a 400 status and error message
async function login(req, res) {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const { user, token } = await authService.loginUser({ email, password });

    res
      .cookie('token', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      .json({
        message: 'Login successful.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({ error: err.message });
  }
}

// Handle logout
// Clears the authentication token cookie and responds with a success message
function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
}

module.exports = {
  register,
  login,
  logout
};
