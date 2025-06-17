// This file defines the journalController for handling journal-related operations
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
    // console.error('Failed to load journal entries:', err);
    res.status(500).json({ error: 'Could not load journal entries.' });
  }
}

// Get a single journal entry with:
// - Decrypted text
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
        date: entry.date.toLocaleString().split('T')[0],
        is_public: entry.is_public,
        public_token: entry.public_token

      },
      topEmotions,
      suggestedTools,
      completedTools
    });
  } catch (err) {
    // console.error('Error loading entry:', err);
    res.status(500).json({ error: 'Could not load entry.' });
  }
}

// Create a new journal entry:
// - Encrypts content
// - Analyzes emotions
// - Stores both
// - Fetches proper topEmotions from DB (with IDs)
// - Returns new entry ID and suggested tools

// Create a new journal entry:
async function createEntry(req, res) {
  const userId = req.user.id;
  const { content } = req.body;

  try {
    // 1) Create + run Watson + save raw emotions
    const { journalEntryId } = await journalService.createEntry(userId, content);

    // 2) Load the final data shape, same as GET single entry
    const entry = await journalService.getEntryById(journalEntryId, userId);
    const decryptedText = journalService.decryptText(entry.text);
    const topEmotions = await journalService.getTopEmotionsForEntry(journalEntryId);
    const suggestedTools = await journalService.getSuggestedTools(topEmotions);
    const completedTools = []; // new entry, so none yet

    res.status(201).json({
      message: 'Entry created successfully.',
      entry: {
        id: entry.id,
        text: decryptedText,
        date: entry.date.toLocaleString().split('T')[0]
      },
      topEmotions,
      suggestedTools,
      completedTools
    });

  } catch (err) {
    // console.error('Error creating entry:', err);
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
    // console.error('Error updating entry:', err);
    res.status(500).json({ error: 'Failed to update entry.' });
  }
}

// Delete a journal entry:
// - Removes both the entry and related emotions
async function deleteEntry(req, res) {
  // console.log('Deleting entry, req.user:', req.user);
  const entryId = req.params.id;
  const userId = req.user.id;

  try {
    await journalService.deleteEntry(entryId, userId);
    res.json({ message: 'Entry deleted successfully.' });
  } catch (err) {
    // console.error('Error deleting entry:', err);
    res.status(500).json({ error: 'Failed to delete entry.' });
  }
}

// Get mood trends for the current user.
// Supports both days OR explicit startDate/endDate with specified emotions.
async function getMoodTrends(req, res) {
  const userId = req.user.id;
  const { days, startDate, endDate, emotions } = req.query;

  try {
    const emotionList = emotions ? emotions.split(',') : ['joy', 'fear', 'sadness', 'anger', 'disgust'];
    let trends = [];

    if (startDate && endDate) {
      trends = await journalService.getMoodTrendsByDateRange(userId, startDate, endDate, emotionList);
    } else {
      const daysNumber = parseInt(days || '30', 10);
      trends = await journalService.getMoodTrends(userId, daysNumber, emotionList);
    }

    res.json({ trends });
  } catch (error) {
    //console.error('Error fetching mood trends:', error);
    res.status(500).json({ error: 'Could not load mood trends.' });
  }
}

// Mark entry public
async function makePublic(req, res) {
  const entryId = req.params.id;
  const userId = req.user.id;

  try {
    const token = await journalService.makeEntryPublic(entryId, userId);
    res.json({ message: 'Entry made public.', publicLink: `/public/${token}` });
  } catch (err) {
    //console.error('Error making entry public:', err);
    res.status(500).json({ error: 'Could not make entry public.' });
  }
}

// Mark entry private
async function makePrivate(req, res) {
  const entryId = req.params.id;
  const userId = req.user.id;

  try {
    await journalService.makeEntryPrivate(entryId, userId);
    res.json({ message: 'Entry made private.' });
  } catch (err) {
    //console.error('Error making entry private:', err);
    res.status(500).json({ error: 'Could not make entry private.' });
  }
}

// Public viewer: Get a public entry by token
async function viewPublicEntry(req, res) {
  const token = req.params.token;

  try {
    // Find entry by token and check if still public
    const entry = await journalService.getPublicEntryByToken(token);

    if (!entry) {
      return res.status(404).json({ error: 'Public entry not found.' });
    }

    // Decrypt it
    const decryptedText = journalService.decryptText(entry.text);

    // Send decrypted text as response
    res.json({
      entry: {
        text: decryptedText,
        date: entry.date.toLocaleString().split('T')[0],
      }
    });

  } catch (err) {
    console.error('Error loading public entry:', err);
    res.status(500).json({ error: 'Could not load public entry.' });
  }
}



module.exports = {
  getUserEntries,
  viewSingleEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getMoodTrends,
  makePublic,
  makePrivate,
  viewPublicEntry
};
