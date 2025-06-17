// middleware/isAdmin.js
// Middleware to check if the user is an admin
// If the user is not an admin, respond with a 403 Forbidden status
module.exports = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admins only.' });
  }
  next();
};
