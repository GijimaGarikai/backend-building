/**
 * Async handler wrapper
 * Catches errors in async route handlers and passes them to error middleware
 *
 * Without this, you need try-catch in every async route.
 * With this, errors are automatically caught and passed to error handler.
 */

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
