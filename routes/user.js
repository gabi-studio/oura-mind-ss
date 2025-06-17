// This file defines routes for the user functionality in the application.
// It includes a route to get the current logged-in user's information
// All routes are protected and require user authentication

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');


// GET /api/user
// Returns the current logged-in user's info

router.get('/', auth, (req, res) => {
  const user = req.user;
  res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

module.exports = router;
