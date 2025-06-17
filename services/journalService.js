//---------------------------------------
// /services/journalService.js
//
// This service handles all CRUD operations
// for user journal entries, including:
// --- Encrypted storage
// --- Emotion analysis (Watson)
// --- Top emotions and related tools
// --- Public link generation
// --- Mood trends for graphs
//
// Uses:
//  - Watson NLP (analyzeEmotions)
//  - Custom utils: encrypt, decrypt, getTopEmotions, getAffirmation
//---------------------------------------


const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/encryption');
const { analyzeEmotions } = require('./watsonService');
const { getTopEmotions } = require('../utils/emotionUtils');
const crypto = require('crypto'); 

//---------------------------------------
// getAllEntries
// Get all journal entries for a user, 
// Decrypting text for each entry 
// and adding top emotions (edit the threshold by changing the second parameter)
async function getAllEntries(userId) {
  const [rows] = await db.execute(
    'SELECT id, text, date FROM journal_entries WHERE user_id = ? ORDER BY date DESC',
    [userId]
  );

  const entriesWithEmotions = await Promise.all(

    // Map through each entry to get top emotions, date
    // and decrypt the text
    rows.map(async (entry) => {
      const emotions = await getTopEmotionsForEntry(entry.id, 0.3);
      const emotionNames = emotions.map(emotion => emotion.name);
      return {
        id: entry.id,
        text: decrypt(entry.text),
        date: entry.date.toLocaleString('en-CA', { timeZone: 'America/Toronto' }).split('T')[0],
        emotions: emotionNames
      };
    })
  );

  return entriesWithEmotions;
}

// Get a single journal entry by ID for a user
async function getEntryById(entryId, userId) {
  const [rows] = await db.execute(
    'SELECT * FROM journal_entries WHERE id = ? AND user_id = ?',
    [entryId, userId]
  );
  return rows[0];
}

//---------------------------------------
// createEntry
// Create a new journal entry: 
// Encrypts content, 
// Analyzes emotions, 
// Saves both along with emotion scores
//---------------------------------------
async function createEntry(userId, content) {
  const encryptedText = encrypt(content);
  const emotions = await analyzeEmotions(content);
  const topEmotions = getTopEmotions(emotions, 0.3);

  const today = new Date();
  const [result] = await db.execute(
    'INSERT INTO journal_entries (user_id, text, date) VALUES (?, ?, ?)',
    [userId, encryptedText, today]
  );
  const journalEntryId = result.insertId;

  await saveEmotions(journalEntryId, emotions);

  return { journalEntryId, topEmotions };
}


//---------------------------------------
// updateEntry
// Update a journal entry's text 
// This will delete existing emotions for the entry,
// Analyze new emotions, and save them again
//---------------------------------------
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

// Delete a journal entry and its emotion records
async function deleteEntry(entryId, userId) {
  await db.execute('DELETE FROM journal_emotions WHERE journal_entry_id = ?', [entryId]);
  await db.execute('DELETE FROM journal_entries WHERE id = ? AND user_id = ?', [entryId, userId]);
}

// Store analyzed emotion scores to the database
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

// Get top emotions for a journal entry
// To Do: Consolidate with getTopEmotions in utils
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

// Get tools mapped to top emotions, removing duplicates
// Joins reflection_tools with emotion_reflection_tool_map
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
  const unique = Object.values(tools.reduce((acc, tool) => {
    acc[tool.id] = tool;
    return acc;
  }, {}));
  return unique;
}

// Get tools already completed by the user for a journal entry
// Joins reflection_tool_responses with reflection_tools

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

// Decrypt text
function decryptText(encryptedText) {
  return decrypt(encryptedText);
}

// To Do: Implement Trends
// In progress...
// Helper to aggregate trends by date.
function buildTrends(entries, emotionData, emotions) {
  const trendsByDate = {};
  entries.forEach(entry => {
    const dateStr = entry.date.toISOString().split('T')[0];
    trendsByDate[dateStr] = { date: dateStr, hasEntries: false, emotions: {} };
    emotions.forEach(em => {
      trendsByDate[dateStr].emotions[em] = { total: 0, count: 0 };
    });
  });

  emotionData.forEach(row => {
    const dateStr = row.date.toISOString().split('T')[0];
    const emotion = row.emotion_name;
    if (trendsByDate[dateStr]) {
      trendsByDate[dateStr].emotions[emotion].total += row.intensity;
      trendsByDate[dateStr].emotions[emotion].count += 1;
      trendsByDate[dateStr].hasEntries = true;
    }
  });

  return Object.values(trendsByDate)
    .filter(day => day.hasEntries)
    .map(day => {
      const result = { date: day.date };
      emotions.forEach(em => {
        const e = day.emotions[em];
        result[em] = e.count > 0 ? Math.round((e.total / e.count) * 100) / 100 : null;
      });
      return result;
    });
}

// Get mood trends for the past N days.
async function getMoodTrends(userId, days = 30, emotions = ['joy', 'fear', 'sadness', 'anger', 'disgust']) {
  const [entries] = await db.execute(
    `SELECT id, date 
     FROM journal_entries 
     WHERE user_id = ? 
     AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY date ASC`,
    [userId, days]
  );
  if (entries.length === 0) return [];

  const ids = entries.map(e => e.id);
  const [emotionData] = await db.execute(
    `SELECT je.journal_entry_id, e.name as emotion_name, je.intensity, entry.date
     FROM journal_emotions je
     JOIN emotions e ON je.emotion_id = e.id
     JOIN journal_entries entry ON je.journal_entry_id = entry.id
     WHERE je.journal_entry_id IN (${ids.map(() => '?').join(',')})
     AND e.name IN (${emotions.map(() => '?').join(',')})
     ORDER BY entry.date ASC`,
    [...ids, ...emotions]
  );

  return buildTrends(entries, emotionData, emotions);
}

// Get mood trends for a specific date range.
async function getMoodTrendsByDateRange(userId, startDate, endDate, emotions = ['joy', 'fear', 'sadness', 'anger', 'disgust']) {
  const [entries] = await db.execute(
    `SELECT id, date 
     FROM journal_entries 
     WHERE user_id = ? 
     AND date >= ? 
     AND date <= ?
     ORDER BY date ASC`,
    [userId, startDate, endDate]
  );
  if (entries.length === 0) return [];

  const ids = entries.map(e => e.id);
  const [emotionData] = await db.execute(
    `SELECT je.journal_entry_id, e.name as emotion_name, je.intensity, entry.date
     FROM journal_emotions je
     JOIN emotions e ON je.emotion_id = e.id
     JOIN journal_entries entry ON je.journal_entry_id = entry.id
     WHERE je.journal_entry_id IN (${ids.map(() => '?').join(',')})
     AND e.name IN (${emotions.map(() => '?').join(',')})
     ORDER BY entry.date ASC`,
    [...ids, ...emotions]
  );

  return buildTrends(entries, emotionData, emotions);
}

// For creating a public link to a journal entry
//



// Generate or update public link for an entry
// Uses Node's UUID for token generation
// This will set the entry as public and generate a token
async function makeEntryPublic(entryId, userId) {
  const token = crypto.randomUUID(); // Node's built-in UUID
  await db.execute(
    'UPDATE journal_entries SET is_public = 1, public_token = ? WHERE id = ? AND user_id = ?',
    [token, entryId, userId]
  );
  return token;
}

// Revoke public link (make private)
// This will remove the public token and set the entry as private
async function makeEntryPrivate(entryId, userId) {
  await db.execute(
    'UPDATE journal_entries SET is_public = 0, public_token = NULL WHERE id = ? AND user_id = ?',
    [entryId, userId]
  );
}

async function getPublicEntryByToken(token) {
  const [rows] = await db.execute(
    'SELECT * FROM journal_entries WHERE public_token = ? AND is_public = 1',
    [token]
  );
  return rows[0];
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
  decryptText,
  getMoodTrends,
  getMoodTrendsByDateRange,
  makeEntryPublic,
  makeEntryPrivate,
  getPublicEntryByToken

};
