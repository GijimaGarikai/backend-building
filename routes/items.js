const express = require('express');
const router = express.Router();

// In-memory data store (we'll use a database in Event 3)
let items = [
    { id: 1, name: 'Learn Express', completed: false },
    { id: 2, name: 'Build an API', completed: false }
];

// GET /items - Get all items
router.get('/', (req, res) => {
    res.json(items);
});

// GET /items/:id - Get a single item by ID
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const item = items.find(i => i.id === id);
    
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
});

// POST /items - Create a new item
router.post('/', (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    
    const newItem = {
        id: items.length + 1,
        name,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    items.push(newItem);
    res.status(201).json(newItem);
});

// PUT /items/:id - Update an item
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const item = items.find(i => i.id === id);
    
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    // Update fields if provided
    if (req.body.name !== undefined) {
        item.name = req.body.name;
    }
    if (req.body.completed !== undefined) {
        item.completed = req.body.completed;
    }
    
    res.json(item);
});

// DELETE /items/:id - Delete an item
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const itemIndex = items.findIndex(i => i.id === id);
    
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    items.splice(itemIndex, 1);
    res.status(204).send(); // 204 No Content
});

module.exports = router;

