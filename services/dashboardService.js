// services/dashboardService.js

const db = require('../config/db');
const { decrypt } = require('../utils/encryption');


// Check if the user is an admin.

function isAdmin(user) {
  return user.role === 'admin';
}


// Get decrypted journal entries for a given user.

async function getUserJournalEntries(userId) {
  const [rows] = await db.execute(
    'SELECT id, text, date FROM journal_entries WHERE user_id = ? ORDER BY date DESC',
    [userId]
  );

  return rows.map(entry => ({
    id: entry.id,
    text: decrypt(entry.text),
    date: entry.date.toISOString().split('T')[0] 
  }));
}


// Return a basic admin summary.
// You can expand this to include actual stats later.

function getAdminSummary(user) {
  return {
    message: 'Welcome to the Admin Dashboard',
    user: {
      id: user.id,
      name: user.name,
      role: user.role
    }
  };
}

module.exports = {
  isAdmin,
  getUserJournalEntries,
  getAdminSummary
};
