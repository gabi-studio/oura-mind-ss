// services/adminToolService.js
const db = require('../config/db');

// Fetch all tools with usage count
async function getAllTools() {
  const [tools] = await db.execute(`
    SELECT rt.*, COUNT(rtr.id) AS usage_count
    FROM reflection_tools rt
    LEFT JOIN reflection_tool_responses rtr ON rt.id = rtr.tool_id
    GROUP BY rt.id
    ORDER BY rt.name
  `);
  return tools;
}

// Create a new tool
async function createTool({ name, description, instructions, path }) {
  await db.execute(
    'INSERT INTO reflection_tools (name, description, instructions, path) VALUES (?, ?, ?, ?)',
    [name, description, instructions, path]
  );
}

// Get a single tool by ID
async function getToolById(id) {
  const [[tool]] = await db.execute(
    'SELECT * FROM reflection_tools WHERE id = ?',
    [id]
  );
  return tool;
}

// Update an existing tool
async function updateTool(id, { name, description, instructions, path }) {
  await db.execute(
    'UPDATE reflection_tools SET name = ?, description = ?, instructions = ?, path = ? WHERE id = ?',
    [name, description, instructions, path, id]
  );
}

// Delete a tool
async function deleteTool(id) {
  await db.execute('DELETE FROM reflection_tools WHERE id = ?', [id]);
}

// Get prompts for a tool
async function getToolPrompts(toolId) {
  const [prompts] = await db.execute(
    'SELECT id, question FROM reflection_tool_prompts WHERE tool_id = ? ORDER BY id ASC',
    [toolId]
  );
  return prompts;
}

// Get emotions linked to a tool
async function getToolEmotions(toolId) {
  const [emotions] = await db.execute(`
    SELECT e.id, e.name
    FROM emotions e
    JOIN emotion_reflection_tool_map m ON e.id = m.emotion_id
    WHERE m.tool_id = ?
  `, [toolId]);
  return emotions;
}

module.exports = {
  getAllTools,
  createTool,
  getToolById,
  updateTool,
  deleteTool,
  getToolPrompts,
  getToolEmotions
};
