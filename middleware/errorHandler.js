// Error handling middleware
// Express will call this if you pass an error to next()
function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    
    // Default error
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

module.exports = errorHandler;

