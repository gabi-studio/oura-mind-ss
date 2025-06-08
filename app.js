const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// ----------- MIDDLEWARE SETUP ----------- //
// Allow cross-origin requests from frontend (local + render deployment)
const allowedOrigins = [
  'http://localhost:5174', // temporary local Vite server
  'https://oura-mind-ss.onrender.com' 
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true, 
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// ----------- VIEW ENGINE SETUP (Pug only for now) ----------- //
app.set('view engine', 'pug');
app.set('views', './views');

// ----------- AUTH MIDDLEWARE ----------- //
const auth = require('./middleware/auth');
const isAdmin = require('./middleware/isAdmin');

// ----------- CONTROLLERS ----------- //
const authController = require('./controllers/authController');
const dashboardController = require('./controllers/dashboardController');
const adminToolController = require('./controllers/adminToolController');
const journalController = require('./controllers/journalController'); 
const toolController = require('./controllers/toolController');

// ----------- ROUTES ----------- //
// Admin routes
app.use('/admin', require('./routes/admin'));

// Journal & Tools (Pug views only for now)
app.use('/journal', require('./routes/journal'));
app.use('/', require('./routes/tools'));

// Auth views (Pug-based)
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));
app.post('/login', authController.login);
app.post('/register', authController.register);
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// Dashboard (Role-based landing)
app.get('/', auth, dashboardController.getDashboard);
app.get('/admin', auth, isAdmin, dashboardController.getAdminDashboard);

// ----------- VIEW ROUTES (Pug only) ----------- //
app.use('/', require('./routes/views'));

// ----------- API ROUTES FOR REACT FRONTEND ----------- //
app.use('/api/auth', require('./routes/auth'));            // Register/Login
app.use('/api/dashboard', require('./routes/dashboard'));  // Dashboard 
app.use('/api/user', require('./routes/user'));            
app.use('/api/admin', require('./routes/admin'));          // for Admin actions
app.use('/api/journal', require('./routes/journal'));      // Journal entries
app.use('/api/tools', require('./routes/tools'));          // Reflection tools

// ----------- START SERVER ----------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
