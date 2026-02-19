const express = require('express');
const { validateRequest } = require('../middleware/validator');
const router = express.Router();

// In-memory data store
let users = [
  { id: 1, username: 'alice', email: 'alice@example.com', role: 'admin', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, username: 'bob', email: 'bob@example.com', role: 'user', createdAt: '2024-01-02T00:00:00.000Z' }
];

/**
 * GET /users
 * Get all users with optional filtering
 *
 * Query params:
 *   - role: filter by role (admin, user)
 *   - search: search by username or email
 */
router.get('/', (req, res) => {
  const { role, search } = req.query;
  let result = [...users];

  // Filter by role
  if (role) {
    result = result.filter(u => u.role === role);
  }

  // Search by username or email
  if (search) {
    const searchLower = search.toLowerCase();
    result = result.filter(u =>
      u.username.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  }

  res.json({
    count: result.length,
    users: result
  });
});

/**
 * GET /users/:id
 * Get a single user by ID
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

/**
 * POST /users
 * Create a new user
 *
 * Body:
 *   - username: string (required, min 3 chars)
 *   - email: string (required, valid email)
 *   - role: string (optional, default: 'user')
 */
router.post(
  '/',
  validateRequest({
    username: { type: 'string', minLength: 3, required: true },
    email: { type: 'email', required: true },
    role: { type: 'string', enum: ['user', 'admin'], default: 'user' }
  }),
  (req, res) => {
    const { username, email, role = 'user' } = req.body;

    // Check if username already exists
    if (users.find(u => u.username === username)) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    if (users.find(u => u.email === email)) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const newUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      username,
      email,
      role,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    res.status(201).json(newUser);
  }
);

/**
 * PATCH /users/:id
 * Update a user (partial update)
 *
 * Body:
 *   - username: string (optional)
 *   - email: string (optional)
 *   - role: string (optional)
 */
router.patch(
  '/:id',
  validateRequest({
    username: { type: 'string', minLength: 3 },
    email: { type: 'email' },
    role: { type: 'string', enum: ['user', 'admin'] }
  }),
  (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update only provided fields
    if (req.body.username !== undefined) {
      // Check if new username is taken by another user
      if (users.find(u => u.username === req.body.username && u.id !== id)) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      user.username = req.body.username;
    }

    if (req.body.email !== undefined) {
      // Check if new email is taken by another user
      if (users.find(u => u.email === req.body.email && u.id !== id)) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      user.email = req.body.email;
    }

    if (req.body.role !== undefined) {
      user.role = req.body.role;
    }

    user.updatedAt = new Date().toISOString();
    res.json(user);
  }
);

/**
 * DELETE /users/:id
 * Delete a user
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(userIndex, 1);
  res.status(204).send();
});

module.exports = router;
