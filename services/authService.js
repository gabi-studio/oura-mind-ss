// services/authService.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
async function registerUser({ name, email, password, role }) {
  // Teh email is required and should be unique
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
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error('Invalid email or password.');
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { user, token };
}

// Update user profile (name & email)
async function updateUserProfile(userId, { name, email }) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');

 // To prevent email conflicts, check if the new email is already taken
  if (email && email !== user.email) {
    const existingEmail = await User.findByEmail(email);
    if (existingEmail && existingEmail.id !== userId) {
      throw new Error('This email is already taken.');
    }
  }

  const updatedUser = await User.updateProfile(userId, { name, email });

  return updatedUser;
}

// Update user password
async function updateUserPassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new Error('Current password is incorrect.');

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updatePassword(userId, hashedPassword);
}

module.exports = {
  registerUser,
  loginUser,
  updateUserProfile,
  updateUserPassword
};
