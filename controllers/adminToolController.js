// controllers/adminToolController.js
// Controller for managing reflection tools in the admin panel
// Use the adminToolService to handle database operations
const adminToolService = require('../services/adminToolService');

// Get all reflection tools with usage counts
// If an error occurs, respond with a 500 status and error message
async function listTools(req, res) {
  try {
    const tools = await adminToolService.getAllTools();
    res.json({ tools });
  } catch (err) {
    console.error('Error loading tools:', err);
    res.status(500).json({ message: 'Failed to load tools.' });
  }
}

// Create a new reflection tool
// Expects name, description, instructions, and path in the request body
// If the tool is created successfully, respond with a 201 status and success message
// If an error occurs, respond with a 500 status and error message
async function createTool(req, res) {
  const { name, description, instructions, path } = req.body;
  try {
    await adminToolService.createTool({ name, description, instructions, path });
    res.status(201).json({ message: 'Tool created' });
  } catch (err) {
    console.error('Error creating tool:', err);
    res.status(500).json({ message: 'Could not create tool.' });
  }
}

// Get a single reflection tool by ID
// If the tool is not found, respond with a 404 status and error message
async function getTool(req, res) {
  const { id } = req.params;
  try {
    const tool = await adminToolService.getToolById(id);
    if (!tool) return res.status(404).json({ message: 'Tool not found' });
    res.json({ tool });
  } catch (err) {
    console.error('Error fetching tool:', err);
    res.status(500).json({ message: 'Failed to fetch tool.' });
  }
}

// Update a reflection tool
// Expects name, description, instructions, and path in the request body
// If the tool is updated successfully, respond with a success message
// If an error occurs, respond with a 500 status and error message
async function updateTool(req, res) {
  const { id } = req.params;
  const { name, description, instructions, path } = req.body;
  try {
    await adminToolService.updateTool(id, { name, description, instructions, path });
    res.json({ message: 'Tool updated' });
  } catch (err) {
    console.error('Error updating tool:', err);
    res.status(500).json({ message: 'Could not update tool.' });
  }
}

// Delete a reflection tool
// Expects the tool ID in the request parameters
// If the tool is deleted successfully, respond with a success message
// If an error occurs, respond with a 500 status and error message
async function deleteTool(req, res) {
  const { id } = req.params;
  try {
    await adminToolService.deleteTool(id);
    res.json({ message: 'Tool deleted' });
  } catch (err) {
    console.error('Error deleting tool:', err);
    res.status(500).json({ message: 'Could not delete tool.' });
  }
}

// Get all prompts for a specific tool
// Expects the tool ID in the request parameters
// If the prompts are fetched successfully, respond with the prompts for that tool
// If an error occurs, respond with a 500 status and error message
async function getToolPrompts(req, res) {
  const { id } = req.params;
  try {
    const prompts = await adminToolService.getToolPrompts(id);
    res.json({ prompts });
  } catch (err) {
    console.error('Error fetching prompts:', err);
    res.status(500).json({ message: 'Failed to load prompts.' });
  }
}

// Get emotions linked to a specific tool
// Expects the tool ID in the request parameters
// If the emotions are fetched successfully, respond with the emotions for that tool
// If an error occurs, respond with a 500 status and error message
async function getToolEmotions(req, res) {
  const { id } = req.params;
  try {
    const emotions = await adminToolService.getToolEmotions(id);
    res.json({ emotions });
  } catch (err) {
    console.error('Error loading emotions:', err);
    res.status(500).json({ message: 'Failed to load linked emotions.' });
  }
}

// Export all adminToolController functions
module.exports = {
  listTools,
  createTool,
  getTool,
  updateTool,
  deleteTool,
  getToolPrompts,
  getToolEmotions
};
