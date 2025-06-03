
// This file contains temporary routes for rendering Pug views 
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const dashboardController = require('../controllers/dashboardController');
const authController = require('../controllers/authController');

// ----------- Landing / Dashboard ----------- //

// Shared landing/dashboard route
router.get('/', auth, dashboardController.getDashboard);

// Admin dashboard (Pug view)
router.get('/admin', auth, isAdmin, dashboardController.getAdminDashboard);


// ----------- Login / Register (Pug views) ----------- //

router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));
router.post('/login', authController.login);
router.post('/register', authController.register);


// ----------- Logout ----------- //

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;
