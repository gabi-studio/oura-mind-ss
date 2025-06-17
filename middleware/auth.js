const jwt = require('jsonwebtoken');


// Middleware for authenticating users.
// Supports both cookie-based and header-based JWTs.
// - Web users get redirected to /login on failure.
// - API clients get JSON error responses.

function isAuthenticated(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return req.path.startsWith('/api')
      ? res.status(401).json({ error: 'Authentication required' })
      : res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return req.path.startsWith('/api')
      ? res.status(403).json({ error: 'Invalid or expired token' })
      : res.redirect('/login');
  }
}

module.exports = isAuthenticated;
