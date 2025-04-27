require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Customer, Provider, User } = require('../database/models'); // Includes User for admin lookup

const JWT_SECRET = process.env.JWT_SECRET;
console.log('✅ JWT_SECRET in auth middleware:', JWT_SECRET);

/**
 * Middleware to protect routes
 * Validates JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      // Initialize user object
      let user = null;

      if (decoded.role === 'customer') {
        user = await Customer.findOne({ userId: decoded.id });
      } else if (decoded.role === 'provider') {
        user = await Provider.findOne({ userId: decoded.id });
      } else if (decoded.role === 'admin') {
        user = await User.findOne({ userId: decoded.id });
      }

      if (!user) {
        return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
      }

      // Attach identity and role
      req.user = user;
      req.user.id = user.userId;        // Fabric ID like customer_xxxx
      req.user.userId =user.userId;    // For compatibility if needed elsewhere
      req.user.role = decoded.role;

      // Add transportMode if provider
      if (decoded.role === 'provider') {
        req.user.transportMode = user.transportMode;
      }

      next();
    } catch (error) {
      console.error('❌ Auth middleware error:', error);
      return res.status(401).json({ success: false, error: 'Not authorized, token invalid' });
    }
  } else {
    return res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }
};

/**
 * Middleware: Admin-only access
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Admins only' });
};

/**
 * Middleware: Customer-only access
 */
const isCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Customers only' });
};

/**
 * Middleware: Provider-only access
 */
const isProvider = (req, res, next) => {
  if (req.user && req.user.role === 'provider') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Providers only' });
};

/**
 * Middleware to restrict access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: `Role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  isCustomer,
  isProvider,
  isAdmin
};
