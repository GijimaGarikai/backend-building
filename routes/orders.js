const express = require('express');
const { validateRequest } = require('../middleware/validator');
const { asyncHandler } = require('../middleware/asyncHandler');
const router = express.Router();

// In-memory data stores
let orders = [
  {
    id: 1,
    userId: 1,
    items: [
      { productId: 1, quantity: 1, price: 999.99 }
    ],
    status: 'completed',
    total: 999.99,
    createdAt: '2024-01-05T00:00:00.000Z'
  }
];

/**
 * GET /orders
 * Get all orders with filtering
 *
 * Query params:
 *   - userId: filter by user ID
 *   - status: filter by status (pending, processing, completed, cancelled)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { userId, status } = req.query;

  // Simulate async operation (database query)
  await new Promise(resolve => setTimeout(resolve, 10));

  let result = [...orders];

  if (userId) {
    result = result.filter(o => o.userId === parseInt(userId));
  }

  if (status) {
    result = result.filter(o => o.status === status);
  }

  res.json({
    count: result.length,
    orders: result
  });
}));

/**
 * GET /orders/:id
 * Get a single order by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 10));

  const order = orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
}));

/**
 * POST /orders
 * Create a new order
 *
 * Body:
 *   - userId: number (required)
 *   - items: array (required)
 *     - productId: number
 *     - quantity: number
 *     - price: number
 */
router.post(
  '/',
  validateRequest({
    userId: { type: 'number', required: true },
    items: {
      type: 'array',
      required: true,
      minLength: 1,
      items: {
        productId: { type: 'number', required: true },
        quantity: { type: 'number', min: 1, required: true },
        price: { type: 'number', min: 0, required: true }
      }
    }
  }),
  asyncHandler(async (req, res) => {
    const { userId, items } = req.body;

    // Calculate total
    const total = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Simulate async operations (validate user, check inventory, etc.)
    await new Promise(resolve => setTimeout(resolve, 10));

    const newOrder = {
      id: Math.max(...orders.map(o => o.id), 0) + 1,
      userId,
      items,
      status: 'pending',
      total: parseFloat(total.toFixed(2)),
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    res.status(201).json(newOrder);
  })
);

/**
 * PATCH /orders/:id/status
 * Update order status
 *
 * Body:
 *   - status: string (pending, processing, completed, cancelled)
 */
router.patch(
  '/:id/status',
  validateRequest({
    status: {
      type: 'string',
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      required: true
    }
  }),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));

    const order = orders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        currentStatus: order.status,
        requestedStatus: status,
        allowedTransitions: validTransitions[order.status]
      });
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    res.json(order);
  })
);

/**
 * DELETE /orders/:id
 * Cancel an order (soft delete)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 10));

  const order = orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Only allow cancellation if order is pending or processing
  if (order.status === 'completed') {
    return res.status(400).json({
      error: 'Cannot cancel completed order',
      status: order.status
    });
  }

  if (order.status === 'cancelled') {
    return res.status(400).json({
      error: 'Order already cancelled',
      status: order.status
    });
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date().toISOString();

  res.json({
    message: 'Order cancelled',
    order
  });
}));

module.exports = router;
