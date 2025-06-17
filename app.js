const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
require('dotenv').config();
const publicRoutes = require('./routes/public');

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://oura-mind-cs.vercel.app'
];

// For me to check requests on the server
// Shows request method and route url on the terminal
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin 
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// // ----------- VIEW ENGINE SETUP (Pug only for now) ----------- //
// app.set('view engine', 'pug');
// app.set('views', './views');

// ----------- AUTH MIDDLEWARE ----------- //
const auth = require('./middleware/auth');
const isAdmin = require('./middleware/isAdmin');

// ----------- CONTROLLERS ----------- //
const authController = require('./controllers/authController');
const dashboardController = require('./controllers/dashboardController');
const adminToolController = require('./controllers/adminToolController');
const journalController = require('./controllers/journalController'); 
const toolController = require('./controllers/toolController');

// ----------- API ROUTES FOR REACT FRONTEND  ----------- //
// Note to self: These MUST come before any catch-all routes
app.use('/api/auth', require('./routes/auth'));            // Register/Login - UNPROTECTED
app.use('/api/dashboard', require('./routes/dashboard'));  // Dashboard 
app.use('/api/user', require('./routes/user'));            
app.use('/api/admin', require('./routes/admin'));          // for Admin actions
app.use('/api/journal', require('./routes/journal'));      // Journal entries
app.use('/api/tools', require('./routes/tools'));          // Reflection tools

app.use('/api/public', publicRoutes);    // Publicly open view for Journal Entries

// Dashboard (Role-based landing)
app.get('/', auth, dashboardController.getDashboard);
app.get('/admin', auth, isAdmin, dashboardController.getAdminDashboard);



// Catch-all error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});

// ----------- START SERVER ----------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
