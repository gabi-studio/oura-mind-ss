// services/journalService.js

const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/encryption');
const { analyzeEmotions } = require('./watsonService');
const { getTopEmotions } = require('../utils/emotionUtils');


// Get all journal entries for a user.
// Decrypts the text and formats the date.

async function getAllEntries(userId) {
  const [rows] = await db.execute(
    'SELECT id, text, date FROM journal_entries WHERE user_id = ? ORDER BY date DESC',
    [userId]
  );

  return rows.map((entry) => ({
    id: entry.id,
    text: decrypt(entry.text),
    date: entry.date.toISOString().split('T')[0],
  }));
}


// Get a single journal entry for a user by ID.

async function getEntryById(entryId, userId) {
  const [rows] = await db.execute(
    'SELECT * FROM journal_entries WHERE id = ? AND user_id = ?',
    [entryId, userId]
  );
  return rows[0];
}


// Create a new journal entry:
// - Encrypts the content
// - Analyzes emotions
// - Stores emotions and encrypted entry

async function createEntry(userId, content) {
  const encryptedText = encrypt(content);
  const emotions = await analyzeEmotions(content);
  const topEmotions = getTopEmotions(emotions, 0.3);

  const [result] = await db.execute(
    'INSERT INTO journal_entries (user_id, text) VALUES (?, ?)',
    [userId, encryptedText]
  );
  const journalEntryId = result.insertId;

  await saveEmotions(journalEntryId, emotions);

  return { journalEntryId, topEmotions };
}


// Update a journal entry's content and emotion scores.

async function updateEntry(entryId, userId, content) {
  const encryptedText = encrypt(content);

  await db.execute(
    'UPDATE journal_entries SET text = ? WHERE id = ? AND user_id = ?',
    [encryptedText, entryId, userId]
  );

  const emotions = await analyzeEmotions(content);
  const topEmotions = getTopEmotions(emotions, 0.3);

  await db.execute('DELETE FROM journal_emotions WHERE journal_entry_id = ?', [entryId]);
  await saveEmotions(entryId, emotions);

  return { entryId, topEmotions };
}


// Delete a journal entry and its emotion data.

async function deleteEntry(entryId, userId) {
  await db.execute('DELETE FROM journal_emotions WHERE journal_entry_id = ?', [entryId]);
  await db.execute(
    'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
    [entryId, userId]
  );
}


// Save analyzed emotion scores to the database.

async function saveEmotions(entryId, emotions) {
  for (const [emotion, intensity] of Object.entries(emotions)) {
    const [[row]] = await db.execute(
      'SELECT id FROM emotions WHERE name = ? LIMIT 1',
      [emotion]
    );
    if (row) {
      await db.execute(
        'INSERT INTO journal_emotions (journal_entry_id, emotion_id, intensity) VALUES (?, ?, ?)',
        [entryId, row.id, intensity]
      );
    }
  }
}


// Get top 1–2 emotions (above threshold) for a journal entry.

async function getTopEmotionsForEntry(entryId, threshold = 0.3) {
  const [rows] = await db.execute(
    `SELECT e.id AS emotion_id, e.name, je.intensity
     FROM journal_emotions je
     JOIN emotions e ON je.emotion_id = e.id
     WHERE je.journal_entry_id = ?
     ORDER BY je.intensity DESC`,
    [entryId]
  );

  return rows.filter(e => e.intensity >= threshold).slice(0, 2);
}


// Get tools mapped to a list of top emotions.
// Removes duplicate tools.

async function getSuggestedTools(topEmotions) {
  let tools = [];

  for (const emotion of topEmotions) {
    const [results] = await db.execute(
      `SELECT rt.* FROM reflection_tools rt
       JOIN emotion_reflection_tool_map map ON map.tool_id = rt.id
       WHERE map.emotion_id = ?`,
      [emotion.emotion_id]
    );
    tools.push(...results);
  }

  const unique = Object.values(
    tools.reduce((acc, tool) => {
      acc[tool.id] = tool;
      return acc;
    }, {})
  );

  return unique;
}


// Get tools already completed by the user for a journal entry.

async function getCompletedTools(entryId, userId) {
  const [tools] = await db.execute(
    `SELECT DISTINCT rt.id, rt.name, rt.path
     FROM reflection_tool_responses r
     JOIN reflection_tools rt ON r.tool_id = rt.id
     WHERE r.journal_entry_id = ? AND r.user_id = ?`,
    [entryId, userId]
  );

  return tools;
}



// Decrypt encrypted text (used in controller for specific entries).

function decryptText(encryptedText) {
  return decrypt(encryptedText);
}

module.exports = {
  getAllEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  saveEmotions,
  getTopEmotionsForEntry,
  getSuggestedTools,
  getCompletedTools,
  decryptText
};
