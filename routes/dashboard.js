const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard - User dashboard (shows journal entries)
router.get('/', auth, dashboardController.getDashboard);

module.exports = router;
