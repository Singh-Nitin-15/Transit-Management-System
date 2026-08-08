const rateLimit = require('express-rate-limit');

/**
 * Auth rate limiter: 10 requests per 15 minutes per IP.
 * Applied to POST /api/auth/login and POST /api/auth/register
 * to prevent brute-force password attacks.
 */
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success:   false,
    message:   'Too many attempts from this IP. Please try again after 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * General API limiter: 100 req/min per IP (safety net for all routes).
 */
const generalLimiter = rateLimit({
  windowMs:        60 * 1000, // 1 minute
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success:   false,
    message:   'Too many requests. Please slow down.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

module.exports = { authLimiter, generalLimiter };
