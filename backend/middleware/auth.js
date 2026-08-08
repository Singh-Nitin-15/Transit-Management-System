const jwt = require('jsonwebtoken');

/**
 * verifyToken — decode JWT from Authorization: Bearer <token>
 * Attaches req.user = { userId, name, email, role }
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, name, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

/**
 * requireRole — factory for role-based authorization.
 * Usage: requireRole('admin')  or  requireRole('user')
 *
 * Design: this runs AFTER verifyToken, not as a replacement.
 * Separating auth (who are you?) from authz (what can you do?)
 * makes each concern independently testable.
 */
const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.role !== role) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires role: ${role}. Your role: ${req.user.role}`,
    });
  }
  next();
};

// Convenience aliases
const requireAuth  = verifyToken;
const requireAdmin = [verifyToken, requireRole('admin')];

module.exports = { verifyToken, requireRole, requireAuth, requireAdmin };
