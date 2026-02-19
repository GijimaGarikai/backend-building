const express = require('express');
const router = express.Router();

// GET /health - Check if server is alive
router.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

