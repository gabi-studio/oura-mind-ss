// seed/adminUser.js
const bcrypt = require('bcrypt');
const db = require('../config/db');

async function seedAdminUser() {
  const name = 'Admin User';
  const email = 'admin@ouramind.com';
  const plainPassword = 'admin123';
  const role = 'admin'; 

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Check if user already exists
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      console.log('Admin user already exists.');
      return;
    }

    // Insert admin user
    await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    console.log('Admin user seeded successfully.');
  } catch (error) {
    console.error('Failed to seed admin user:', error);
  } finally {
    process.exit();
  }
}

seedAdminUser();
