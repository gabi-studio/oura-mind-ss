// This file defines routes for the reflection tool functionality in the application
// It includes routes for creating, viewing, editing, and deleting reflection tool entries
// All routes are protected and require user authentication
// The controller functions are defined in toolController.js

const express = require('express');
const router = express.Router();
const toolController = require('../controllers/toolController');
const isAuthenticated = require('../middleware/auth');

// All routes below require authentication
router.use(isAuthenticated);

// Load the reflection tool form (new entry)
router.get('/:path/form/:entryId', toolController.getToolFormData);

// Submit new reflection tool entry
router.post('/:path/submit/:entryId', toolController.submitTool);

// View completed reflection tool (read-only)
router.get('/:path/view/:entryId', toolController.getCompletedTool);

// Edit mode: prefill form with previous responses
router.get('/:path/edit/:entryId', toolController.getToolEditData);

// Update previously submitted reflection tool
router.post('/:path/update/:entryId', toolController.updateTool);

// Delete reflection tool submission
router.delete('/:path/delete/:entryId', toolController.deleteToolSubmission);



module.exports = router;
