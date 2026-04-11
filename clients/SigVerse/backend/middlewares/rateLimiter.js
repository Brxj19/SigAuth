const rateLimit = require('express-rate-limit');

// Local development is exempted to avoid blocking rapid manual/API testing.
const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = rateLimit({
  // Time window (in ms) used to count requests per client/IP.
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  // Max requests allowed inside the configured window.
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  // Emit modern RateLimit headers for better client observability.
  standardHeaders: true,
  // Disable older X-RateLimit-* headers to reduce duplicate metadata.
  legacyHeaders: false,
  // Skip limiting entirely outside production.
  skip: () => isDevelopment,
  // Keep rejected response payload aligned with API response conventions.
  message: { success: false, message: 'Too many requests, please try again later' }
});
