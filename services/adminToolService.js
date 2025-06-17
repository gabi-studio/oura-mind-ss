//---------------------------------------
// /services/adminToolService.js
//
// This file provides backend services for managing Reflection Tools (Admin only)
//
// Includes:
// CRUD for tools
// CRUD for prompts
// CRUD for tool-emotion mappings
// Usage stats
// Daily stats
// All emotions
//
//---------------------------------------
const db = require('../config/db');

//---------------------------------------
// getAllTools
// Fetch all reflection tools with usage count
//
// SQL:
//  SELECT all columns from reflection_tools (alias rt)
//  LEFT JOIN with reflection_tool_responses to count how many responses exist for each tool
//
// Example use: shows each tool with how many times it's been used
//---------------------------------------
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

//---------------------------------------
// createTool
// Create a new reflection tool, along with its prompts and linked emotions.
//
// SQL:
//  - Insert into reflection_tools for basic fields
//  - Insert multiple prompts in bulk (using VALUES placeholders)
//  - Insert emotion-tool mappings in bulk
//---------------------------------------
async function createTool({ name, description, instructions, path, prompts = [], emotions = [] }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insert main tool record, id is AUTO_INCREMENT
    const [result] = await conn.execute(
      `INSERT INTO reflection_tools (name, description, instructions, path)
       VALUES (?, ?, ?, ?)`,
      [name, description, instructions, path]
    );
    const toolId = result.insertId;

    // Insert multiple prompts if they exist
    // Each prompt has label, field_name, field_type, sort_order
    if (prompts.length > 0) {
      const placeholders = prompts.map(() => `(?, ?, ?, ?, ?)`).join(', ');
      const values = prompts.flatMap(p => [
        toolId,
        p.label || '',
        p.field_name || '',
        p.field_type || 'text',
        p.sort_order || 0
      ]);
      await conn.execute(
        `INSERT INTO reflection_tool_prompts
         (tool_id, label, field_name, field_type, sort_order)
         VALUES ${placeholders}`,
        values
      );
    }


    // Insert emotion mappings if any
    // On the client side, this will be used in the Tool Creation form
    // Will use a checkbox to select emotions
    // Each emotion is linked to the Reflection tool in the databasevia emotion_reflection_tool_map
    if (emotions.length > 0) {
      const placeholders = emotions.map(() => `(?, ?)`).join(', ');
      const values = emotions.flatMap(eid => [eid, toolId]);
      await conn.execute(
        `INSERT INTO emotion_reflection_tool_map (emotion_id, tool_id)
         VALUES ${placeholders}`,
        values
      );
    }

    // .Return result once all inserts are successful
    // I'm using a transaction here because I was having issues with doing the update all at once with multiple queries
    // If any query fails, can rollback to the previous state
    // References on mysql transactions:
    // https://stackoverflow.com/questions/47809269/node-js-mysql-pool-begintransaction-connection
    // https://www.npmjs.com/package/mysql-transactions
    // https://www.geeksforgeeks.org/node-js/how-to-use-transactions-in-mysql-with-nodejs/
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Get a single tool by ID
async function getToolById(id) {
  const [[tool]] = await db.execute(
    'SELECT * FROM reflection_tools WHERE id = ?',
    [id]
  );
  return tool;
}

//---------------------------------------
// updateTool
// Update a tool's basic info, including prompts + emotion mappings
//
// SQL:
//  - UPDATE reflection_tools
//  - DELETE old prompts, INSERT new ones
//  - DELETE old emotion mappings, INSERT new ones
//
//---------------------------------------
async function updateTool(id, { name, description, instructions, path, prompts = [], emotions = [] }) {
  const conn = await db.getConnection();
  try {

    // I'm using a transaction here because I was having issues with doing the update all at once with multiple queries
    // If any query fails, can rollback to the previous state
    // References on mysql transactions:
    // https://stackoverflow.com/questions/47809269/node-js-mysql-pool-begintransaction-connection
    // https://www.npmjs.com/package/mysql-transactions
    // https://www.geeksforgeeks.org/node-js/how-to-use-transactions-in-mysql-with-nodejs/
    await conn.beginTransaction();

    // Update the tool's base fields
    await conn.execute(
      `UPDATE reflection_tools
       SET name = ?, description = ?, instructions = ?, path = ?
       WHERE id = ?`,
      [name, description, instructions, path, id]
    );

    //Specific for prompts and emotions
    // Delete old prompts for this tool
    await conn.execute(`DELETE FROM reflection_tool_prompts WHERE tool_id = ?`, [id]);

    // Insert updated prompts
    if (prompts.length > 0) {
      const placeholders = prompts.map(() => `(?, ?, ?, ?, ?)`).join(', ');
      const values = prompts.flatMap(p => [
        id,
        p.label || '',
        p.field_name || '',
        p.field_type || 'text',
        p.sort_order || 0
      ]);
      await conn.execute(
        `INSERT INTO reflection_tool_prompts
         (tool_id, label, field_name, field_type, sort_order)
         VALUES ${placeholders}`,
        values
      );
    }

    // Delete old emotion mappings
    await conn.execute(`DELETE FROM emotion_reflection_tool_map WHERE tool_id = ?`, [id]);

    // Insert updated emotions
    if (emotions.length > 0) {
      const placeholders = emotions.map(() => `(?, ?)`).join(', ');
      const values = emotions.flatMap(eid => [eid, id]);
      await conn.execute(
        `INSERT INTO emotion_reflection_tool_map (emotion_id, tool_id)
         VALUES ${placeholders}`,
        values
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

//---------------------------------------
// Delete a tool by ID
// This will remove the tool and all its prompts and emotion mappings
async function deleteTool(id) {
  await db.execute('DELETE FROM reflection_tools WHERE id = ?', [id]);
}

// Get prompts for a specific tool (by ID)

async function getToolPrompts(toolId) {
  const [prompts] = await db.execute(
    `
    SELECT 
      id, 
      label, 
      field_name, 
      field_type, 
      sort_order 
    FROM reflection_tool_prompts 
    WHERE tool_id = ? 
    ORDER BY sort_order ASC
    `,
    [toolId]
  );
  return prompts;
}

// ---------------------------------------
// getToolEmotions
// Get emotions linked to a tool
// Joins emotions with the emotion_reflection_tool_map to get all emotions for a specific tool
async function getToolEmotions(toolId) {
  const [emotions] = await db.execute(`
    SELECT e.id, e.name
    FROM emotions e
    JOIN emotion_reflection_tool_map m ON e.id = m.emotion_id
    WHERE m.tool_id = ?
  `, [toolId]);
  return emotions;
}

//---------------------------------------
// getOverallStats
// Get overall statistics for the admin dashboard
// This function retrieves total counts of users, journal entries, and tool usage
async function getOverallStats() {
  try {
    const [totalUsersResult] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [totalEntriesResult] = await db.execute('SELECT COUNT(*) as count FROM journal_entries');
    const [totalToolUsageResult] = await db.execute('SELECT COUNT(*) as count FROM reflection_tool_responses');

    return {
      totalUsers: totalUsersResult[0].count,
      totalEntries: totalEntriesResult[0].count,
      totalToolUsage: totalToolUsageResult[0].count
    };
  } catch (error) {
    throw new Error('Error fetching overall statistics');
  }
}

// TO DO: Daily stats
// Get daily statistics for the past 30 days

// Get all emotions
async function getAllEmotions() {
  const [emotions] = await db.execute(
    'SELECT id, name FROM emotions ORDER BY name ASC'
  );
  return emotions;
}

// Export all service functions
module.exports = {
  getAllTools,
  createTool,
  getToolById,
  updateTool,
  deleteTool,
  getToolPrompts,
  getToolEmotions,
  getOverallStats,
  getAllEmotions,
};
