// This file defines the dashboard functionality in the application
// It includes routes for the main user dashboard and the admin dashboard
// All routes are protected and require user authentication
// It uses a dashboardService to handle logic for showing Journal entries in a dashboard and admin summaries

const dashboardService = require('../services/dashboardService');


// Handle the main dashboard route.
// - Admins: redirect to admin area
// - Regular users: return their journal entries

const getDashboard = async (req, res) => {
  const user = req.user;

  if (dashboardService.isAdmin(user)) {
    return res.status(302).json({ redirect: '/admin' });
  }

  try {
    const entries = await dashboardService.getUserJournalEntries(user.id);

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      entries
    });
  } catch (err) {
    console.error('Failed to load journal entries:', err);
    res.status(500).json({ error: 'Failed to load your journal entries.' });
  }
};


// Handle the admin dashboard route.
// - Only accessible by users with the 'admin' role

const getAdminDashboard = async (req, res) => {
  const user = req.user;

  if (!dashboardService.isAdmin(user)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const summary = dashboardService.getAdminSummary(user);
  res.status(200).json(summary);
};

// Export all dashboardController functions
module.exports = {
  getDashboard,
  getAdminDashboard
};
