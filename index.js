const express = require('express');
const cors = require('cors');

// Import routes
const healthRouter = require('./routes/health');
const itemsRouter = require('./routes/items');
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

// Import middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware (applied to all routes)
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies
app.use(logger); // Log all requests

// Routes
app.use('/health', healthRouter);
app.use('/items', itemsRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);

// 404 handler (must be after all routes)
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('\nAvailable endpoints:');
    console.log('  GET    /health');
    console.log('  GET    /items');
    console.log('  GET    /users');
    console.log('  GET    /products');
    console.log('  GET    /orders');
    console.log('\nSee README.md for complete API documentation');
});
