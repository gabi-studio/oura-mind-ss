const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');

// For public access to journal entries
// This route does not require authentication
// But it needs author/Reflector to make the entry public first
router.get('/:token', journalController.viewPublicEntry);

module.exports = router;
