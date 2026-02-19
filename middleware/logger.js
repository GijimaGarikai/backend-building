/**
 * Request logging middleware
 * Logs HTTP requests with timing information
 */

function logger(req, res, next) {
  const startTime = Date.now();

  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  // Capture original res.json to log response
  const originalJson = res.json.bind(res);

  res.json = function(body) {
    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
    return originalJson(body);
  };

  // Capture original res.send to log response
  const originalSend = res.send.bind(res);

  res.send = function(body) {
    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
    return originalSend(body);
  };

  next();
}

module.exports = logger;
