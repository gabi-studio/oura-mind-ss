// This file defines controller functions for handling tool-related operations in the application
// It includes functions to load tool data, submit reflections, and manage entries
// Uses toolService to perform database operations

const toolService = require('../services/toolService');


// Load data for the tool form page:
// - Tool details
// - Prompts for the tool
// - List of moods

async function getToolFormData(req, res) {
  const { path, entryId } = req.params;

  try {
    const tool = await toolService.getToolByPath(path);
    if (!tool) return res.status(404).json({ error: 'Reflection tool not found.' });

    const prompts = await toolService.getPromptsForTool(tool.id);
    const moods = await toolService.getMoods();

    res.json({ tool, prompts, moods, entryId });
  } catch (error) {
    // console.error('Error loading reflection tool form:', error);
    res.status(500).json({ error: 'Could not load reflection tool form.' });
  }
}


// Save a new reflection entry for the given journal entry.
// Stores both the prompt responses and mood scores.

async function submitTool(req, res) {
  const { path, entryId } = req.params;
  const userId = req.user.id;
  const data = req.body;

  try {
    const tool = await toolService.getToolByPath(path);
    if (!tool) return res.status(404).json({ error: 'Reflection tool not found.' });

    const prompts = await toolService.getPromptsForTool(tool.id);
    const moods = await toolService.getMoods();

    await toolService.saveResponses({ userId, entryId, toolId: tool.id, prompts, data });
    await toolService.saveMoodRatings({ userId, entryId, toolId: tool.id, moods, data });

    res.status(201).json({ message: 'Reflection submitted successfully.' });
  } catch (error) {
    // console.error('Error submitting reflection tool:', error);
    res.status(500).json({ error: 'Failed to submit reflection.' });
  }
}


// Load a completed reflection entry:
// - Includes answers and mood ratings for display

async function getCompletedTool(req, res) {
  const { path, entryId } = req.params;
  const userId = req.user.id;

  try {
    const tool = await toolService.getToolByPath(path);
    if (!tool) return res.status(404).json({ error: 'Reflection tool not found.' });

    const prompts = await toolService.getPromptsForTool(tool.id);
    const responseMap = await toolService.getResponseMap(userId, entryId, tool.id);
    const moodRatings = await toolService.getMoodRatings(userId, entryId, tool.id);

    res.json({ tool, prompts, responseMap, moodRatings, entryId });
  } catch (error) {
    // console.error('Error loading completed reflection tool:', error);
    res.status(500).json({ error: 'Could not load completed reflection.' });
  }
}


// Load an existing reflection tool for editing:
// - Pre-fills responses and mood values

async function getToolEditData(req, res) {
  const { path, entryId } = req.params;
  const userId = req.user.id;

  try {
    const tool = await toolService.getToolByPath(path);
    if (!tool) return res.status(404).json({ error: 'Reflection tool not found.' });

    const prompts = await toolService.getPromptsForTool(tool.id);
    const moods = await toolService.getMoods();
    const responseMap = await toolService.getResponseMap(userId, entryId, tool.id);
    const moodMap = await toolService.getMoodRatings(userId, entryId, tool.id);

    res.json({ tool, prompts, moods, entryId, responseMap, moodMap });
  } catch (error) {
    // console.error('Error loading tool for edit:', error);
    res.status(500).json({ error: 'Could not load edit data.' });
  }
}


// Update an existing reflection:
// - Deletes old responses and ratings
// - Saves new ones

async function updateTool(req, res) {
  const { path, entryId } = req.params;
  const userId = req.user.id;
  const data = req.body;

  try {
    const tool = await toolService.getToolByPath(path);
    if (!tool) return res.status(404).json({ error: 'Reflection tool not found.' });

    const prompts = await toolService.getPromptsForTool(tool.id);
    const moods = await toolService.getMoods();

    await toolService.deletePreviousSubmission(userId, entryId, tool.id);
    await toolService.saveResponses({ userId, entryId, toolId: tool.id, prompts, data });
    await toolService.saveMoodRatings({ userId, entryId, toolId: tool.id, moods, data });

    res.json({ message: 'Reflection updated successfully.' });
  } catch (error) {
    // console.error('Error updating reflection tool:', error);
    res.status(500).json({ error: 'Failed to update reflection.' });
  }
}


// Remove a submitted reflection tool entry:
// - Deletes responses and mood ratings

async function deleteToolSubmission(req, res) {
  const { path, entryId } = req.params;
  const userId = req.user.id;

  try {
    const tool = await toolService.getToolByPath(path);
    if (!tool) return res.status(404).json({ error: 'Reflection tool not found.' });

    await toolService.deletePreviousSubmission(userId, entryId, tool.id);
    res.json({ message: 'Reflection deleted successfully.' });
  } catch (error) {
    // console.error('Error deleting reflection submission:', error);
    res.status(500).json({ error: 'Failed to delete reflection.' });
  }
}

// Export all controller functions
module.exports = {
  getToolFormData,
  submitTool,
  getCompletedTool,
  getToolEditData,
  updateTool,
  deleteToolSubmission
};
