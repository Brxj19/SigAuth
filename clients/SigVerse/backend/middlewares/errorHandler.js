module.exports = (err, req, res, next) => {
  // Prefer explicit HTTP status values set by upstream code; fallback to 500.
  const status = err.status || err.statusCode || 500;
  // Surface the original error message when available for easier debugging.
  const message = err.message || 'Internal Server Error';
  // Log both the summary and stack trace so server logs retain full context.
  console.error(`[ERROR] ${status} — ${message}`, err.stack);
  // Keep API error response shape consistent across the app.
  res.status(status).json({
    success: false,
    data: null,
    message,
    errors: err.details || null
  });
};
