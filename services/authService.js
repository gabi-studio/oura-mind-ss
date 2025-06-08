// services/authService.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
async function registerUser({ name, email, password, role }) {
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new Error('Email is already registered.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = await User.create(name, email, hashedPassword, role);
  const newUser = await User.findByEmail(email);

  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, role: newUser.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { user: newUser, token };
}

// Log in an existing user
async function loginUser({ email, password }) {
  const user = await User.findByEmail(email);
  console.log('Trying login for:', email);
  if (!user) {
    console.log('No user found');
    throw new Error('Invalid email or password.');
  }

  console.log('User found:', user.email);

  const match = await bcrypt.compare(password, user.password);
  console.log('Password match result:', match);

  if (!match) {
    console.log('Password mismatch');
    throw new Error('Invalid email or password.');
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  console.log('Login successful for', user.email);
  return { user, token };
}


module.exports = {
  registerUser,
  loginUser
};
