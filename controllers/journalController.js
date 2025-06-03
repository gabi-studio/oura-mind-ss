// This files defines the journalController for handling journal-related operations
// It includes functions to get, create, update, and delete journal entries
// All routes are protected and require user authentication
// It uses journalService to handle the specific actions related to journal entries

const journalService = require('../services/journalService');


// Get all journal entries for the current user.
// Decrypts and returns them for display.

async function getUserEntries(req, res) {
  try {
    const entries = await journalService.getAllEntries(req.user.id);
    res.json({ entries });
  } catch (err) {
    console.error('Failed to load journal entries:', err);
    res.status(500).json({ error: 'Could not load journal entries.' });
  }
}


// Get a single journal entry with:
//- Decrypted text
// - Top emotions
// - Suggested tools based on those emotions
// - Tools the user has already completed

async function viewSingleEntry(req, res) {
  const entryId = req.params.id;
  const userId = req.user.id;

  try {
    const entry = await journalService.getEntryById(entryId, userId);
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });

    const decryptedText = journalService.decryptText(entry.text);
    const topEmotions = await journalService.getTopEmotionsForEntry(entryId);
    const suggestedTools = await journalService.getSuggestedTools(topEmotions);
    const completedTools = await journalService.getCompletedTools(entryId, userId);

    res.json({
      entry: {
        id: entry.id,
        text: decryptedText,
        date: entry.date.toISOString().split('T')[0]
      },
      topEmotions,
      suggestedTools,
      completedTools
    });
  } catch (err) {
    console.error('Error loading entry:', err);
    res.status(500).json({ error: 'Could not load entry.' });
  }
}


// Create a new journal entry:
// - Encrypts and stores the content
// - Analyzes emotions
// - Returns the new entry ID and tool suggestions
 
async function createEntry(req, res) {
  const userId = req.user.id;
  const { content } = req.body;

  try {
    const { journalEntryId, topEmotions } = await journalService.createEntry(userId, content);
    const suggestedTools = await journalService.getSuggestedTools(topEmotions);

    res.status(201).json({
      message: 'Entry created successfully.',
      entryId: journalEntryId,
      suggestedTools
    });
  } catch (err) {
    console.error('Error creating entry:', err);
    res.status(500).json({ error: 'Failed to create entry.' });
  }
}


// Update an existing journal entry:
// - Encrypts new content
// - Updates emotions

async function updateEntry(req, res) {
  const entryId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;

  try {
    const { topEmotions } = await journalService.updateEntry(entryId, userId, content);
    res.json({
      message: 'Entry updated successfully.',
      entryId,
      topEmotions
    });
  } catch (err) {
    console.error('Error updating entry:', err);
    res.status(500).json({ error: 'Failed to update entry.' });
  }
}


// Delete a journal entry:
// - Removes both the entry and related emotions
//
async function deleteEntry(req, res) {
  const entryId = req.params.id;
  const userId = req.user.id;

  try {
    await journalService.deleteEntry(entryId, userId);
    res.json({ message: 'Entry deleted successfully.' });
  } catch (err) {
    console.error('Error deleting entry:', err);
    res.status(500).json({ error: 'Failed to delete entry.' });
  }
}

// Export all journalController functions
module.exports = {
  getUserEntries,
  viewSingleEntry,
  createEntry,
  updateEntry,
  deleteEntry
};
