// This file defines routes for the Admin functionality in the application
// The Admin routes are protected and require authentication and admin privileges
// The Admin can manage tools, including creating, updating, deleting, and listing tools

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const adminToolController = require('../controllers/adminToolController');

// Protect all admin routes with authentication and admin check
router.use(auth, isAdmin);

// Tools API Routes

// GET all tools with usage count
router.get('/tools', adminToolController.listTools);

// GET a single tool by ID
router.get('/tools/:id', adminToolController.getTool);

// POST create a new tool
router.post('/tools', adminToolController.createTool);

// PUT update a tool
router.put('/tools/:id', adminToolController.updateTool);

// DELETE a tool
router.delete('/tools/:id', adminToolController.deleteTool);

// Get prompts
router.get('/tools/:id/prompts', adminToolController.getToolPrompts);

// Statistics routes
router.get('/stats', adminToolController.getStats);
router.get('/stats/daily', adminToolController.getDailyStats);

// Emotions routes
router.get('/emotions', adminToolController.listEmotions);
router.get('/tools/:id/emotions', adminToolController.getToolEmotions);



module.exports = router;
