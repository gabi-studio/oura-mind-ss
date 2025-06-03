// services/toolService.js
const db = require('../config/db');

//
// Get tool metadata by path.
//
async function getToolByPath(path) {
  const [[tool]] = await db.execute('SELECT * FROM reflection_tools WHERE path = ?', [path]);
  return tool;
}


// Get prompts for a tool.

async function getPromptsForTool(toolId) {
  const [prompts] = await db.execute(
    'SELECT * FROM reflection_tool_prompts WHERE tool_id = ? ORDER BY id ASC',
    [toolId]
  );
  return prompts;
}


// Get mood list.

async function getMoods() {
  const [moods] = await db.execute('SELECT id, name FROM moods ORDER BY id ASC');
  return moods;
}


// Save reflection responses for each prompt.

async function saveResponses({ userId, entryId, toolId, prompts, data }) {
  for (let i = 0; i < prompts.length; i++) {
    const promptId = prompts[i].id;
    const response = data[`prompt_${i}`];
    await db.execute(
      `INSERT INTO reflection_tool_responses
       (user_id, journal_entry_id, tool_id, prompt_id, response)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, entryId, toolId, promptId, response]
    );
  }
}


// Save before/after mood ratings.

async function saveMoodRatings({ userId, entryId, toolId, moods, data }) {
  for (const mood of moods) {
    const before = data[`before_${mood.name}`];
    const after = data[`after_${mood.name}`];
    await db.execute(
      `INSERT INTO reflection_tool_mood_ratings
       (user_id, journal_entry_id, tool_id, mood_id, type, value)
       VALUES (?, ?, ?, ?, 'before', ?), (?, ?, ?, ?, 'after', ?)`,
      [userId, entryId, toolId, mood.id, before, userId, entryId, toolId, mood.id, after]
    );
  }
}


// Get responses (as a prompt ID → response map).

async function getResponseMap(userId, entryId, toolId) {
  const [responses] = await db.execute(
    `SELECT prompt_id, response 
     FROM reflection_tool_responses 
     WHERE user_id = ? AND journal_entry_id = ? AND tool_id = ?`,
    [userId, entryId, toolId]
  );

  const map = {};
  for (const row of responses) {
    map[row.prompt_id] = row.response;
  }
  return map;
}


// Get mood ratings (as a mood → { before, after } object).

async function getMoodRatings(userId, entryId, toolId) {
  const [rows] = await db.execute(
    `SELECT m.name AS mood, r.type, r.value
     FROM reflection_tool_mood_ratings r
     JOIN moods m ON r.mood_id = m.id
     WHERE r.user_id = ? AND r.journal_entry_id = ? AND r.tool_id = ?`,
    [userId, entryId, toolId]
  );

  const ratings = {};
  for (const row of rows) {
    if (!ratings[row.mood]) ratings[row.mood] = {};
    ratings[row.mood][row.type] = row.value;
  }
  return ratings;
}


// Delete existing responses and mood ratings for a tool and journal entry.

async function deletePreviousSubmission(userId, entryId, toolId) {
  await db.execute(
    'DELETE FROM reflection_tool_responses WHERE user_id = ? AND journal_entry_id = ? AND tool_id = ?',
    [userId, entryId, toolId]
  );

  await db.execute(
    'DELETE FROM reflection_tool_mood_ratings WHERE user_id = ? AND journal_entry_id = ? AND tool_id = ?',
    [userId, entryId, toolId]
  );
}

module.exports = {
  getToolByPath,
  getPromptsForTool,
  getMoods,
  saveResponses,
  saveMoodRatings,
  getResponseMap,
  getMoodRatings,
  deletePreviousSubmission
};
