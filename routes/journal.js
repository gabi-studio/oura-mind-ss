// This file defines the routes for handling journal entries in the application
// It includes routes for creating, viewing, updating, and deleting journal entries
// routes/journal.js
// REST API for managing journal entries (used by React frontend)


const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const isAuthenticated = require('../middleware/auth');


// All journal routes require user to be logged in
router.use(isAuthenticated);

// Get all journal entries for the logged-in user
router.get('/', journalController.getUserEntries);

// Get moods over time for the user
router.get('/mood-trends', journalController.getMoodTrends);

// Get a specific journal entry by ID
router.get('/:id', journalController.viewSingleEntry);

// Create a new journal entry
router.post('/', journalController.createEntry);

// Update an existing journal entry by ID
router.put('/:id', journalController.updateEntry);

// Delete a journal entry by ID
router.delete('/:id', journalController.deleteEntry);

// Public toggle for a journal entry
router.put('/:id/make-public', journalController.makePublic);

// Private toggle for a journal entry
router.put('/:id/make-private', journalController.makePrivate);



module.exports = router;
