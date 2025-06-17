// controllers/authController.js

const authService = require('../services/authService');

const isProduction = process.env.NODE_ENV === 'production';

// Get cookie configuration based on environment
function getCookieConfig() {
  if (isProduction) {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    };
  } else {
    // Development settings 
    return {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    };
  }
}

// Handle user registration
async function register(req, res) {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const role = req.body.role || 'reflector';

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const { user, token } = await authService.registerUser({ name, email, password, role });

    const cookieConfig = getCookieConfig();
    res
      .cookie('token', token, cookieConfig)
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
    // console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
}

// Handle user login
async function login(req, res) {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const { user, token } = await authService.loginUser({ email, password });

    const cookieConfig = getCookieConfig();
    res.cookie('token', token, cookieConfig);

    res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    // console.error('[LOGIN] Login error:', err);
    res.status(400).json({ error: err.message || 'Login failed.' });
  }
}

// Handle logout
function logout(req, res) {
  const cookieConfig = getCookieConfig();
  res.clearCookie('token', {
    path: cookieConfig.path,
    sameSite: cookieConfig.sameSite,
    secure: cookieConfig.secure
  });

  res.json({ message: 'Logged out successfully.' });
}

// Get current user info
function getCurrentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
}

// Update profile info
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    const updatedUser = await authService.updateUserProfile(userId, { name, email });

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });

  } catch (err) {
    // console.error('[UPDATE PROFILE] Error:', err);
    res.status(400).json({ error: err.message });
  }
}

// Update password
async function updatePassword(req, res) {
  try {
    const userId = req.user.id;
    const { password: currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }

    await authService.updateUserPassword(userId, { currentPassword, newPassword });

    res.json({ message: 'Password updated successfully.' });

  } catch (err) {
    // console.error('[UPDATE PASSWORD] Error:', err);
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  updatePassword
};
