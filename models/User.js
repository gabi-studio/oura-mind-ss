const db = require('../config/db');

const User = {
    // Find a user by email
    // This function executes a SQL query to find first matching user by email
    findByEmail: async (email) => {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    // create a new user
    // This function executes a SQL query to insert a new user into the database
    // It takes email, hashed password, and role as parameters
    // The role defaults to 'reflector' if not provided
    // It returns the ID of the newly created user
    create: async (name, email, hashedPassword, role = 'reflector') => {
    const [result] = await db.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
    );

    return result.insertId;
  }
};

module.exports = User;
