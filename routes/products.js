const express = require('express');
const { validateRequest } = require('../middleware/validator');
const router = express.Router();

// In-memory data store
let products = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'electronics', stock: 50, createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, name: 'Desk Chair', price: 199.99, category: 'furniture', stock: 120, createdAt: '2024-01-02T00:00:00.000Z' },
  { id: 3, name: 'Coffee Mug', price: 12.99, category: 'kitchenware', stock: 200, createdAt: '2024-01-03T00:00:00.000Z' }
];

/**
 * GET /products
 * Get all products with filtering, sorting, and pagination
 *
 * Query params:
 *   - category: filter by category
 *   - minPrice: minimum price filter
 *   - maxPrice: maximum price filter
 *   - inStock: only show in-stock items (true/false)
 *   - sort: field to sort by (name, price, stock)
 *   - order: sort order (asc, desc)
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 10)
 */
router.get('/', (req, res) => {
  const {
    category,
    minPrice,
    maxPrice,
    inStock,
    sort = 'name',
    order = 'asc',
    page = 1,
    limit = 10
  } = req.query;

  let result = [...products];

  // Filter by category
  if (category) {
    result = result.filter(p => p.category === category);
  }

  // Filter by price range
  if (minPrice) {
    result = result.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    result = result.filter(p => p.price <= parseFloat(maxPrice));
  }

  // Filter in-stock only
  if (inStock === 'true') {
    result = result.filter(p => p.stock > 0);
  }

  // Sort
  const validSortFields = ['name', 'price', 'stock', 'createdAt'];
  if (validSortFields.includes(sort)) {
    result.sort((a, b) => {
      const aVal = a[sort];
      const bVal = b[sort];

      if (typeof aVal === 'string') {
        return order === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;

  const paginatedResults = result.slice(startIndex, endIndex);

  res.json({
    page: pageNum,
    limit: limitNum,
    total: result.length,
    totalPages: Math.ceil(result.length / limitNum),
    products: paginatedResults
  });
});

/**
 * GET /products/:id
 * Get a single product by ID
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(product);
});

/**
 * POST /products
 * Create a new product
 *
 * Body:
 *   - name: string (required)
 *   - price: number (required, > 0)
 *   - category: string (required)
 *   - stock: number (optional, default: 0)
 */
router.post(
  '/',
  validateRequest({
    name: { type: 'string', minLength: 1, required: true },
    price: { type: 'number', min: 0, required: true },
    category: { type: 'string', minLength: 1, required: true },
    stock: { type: 'number', min: 0, default: 0 }
  }),
  (req, res) => {
    const { name, price, category, stock = 0 } = req.body;

    const newProduct = {
      id: Math.max(...products.map(p => p.id), 0) + 1,
      name,
      price,
      category,
      stock,
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
  }
);

/**
 * PUT /products/:id
 * Update a product (full update)
 */
router.put(
  '/:id',
  validateRequest({
    name: { type: 'string', minLength: 1, required: true },
    price: { type: 'number', min: 0, required: true },
    category: { type: 'string', minLength: 1, required: true },
    stock: { type: 'number', min: 0, required: true }
  }),
  (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, price, category, stock } = req.body;

    products[productIndex] = {
      ...products[productIndex],
      name,
      price,
      category,
      stock,
      updatedAt: new Date().toISOString()
    };

    res.json(products[productIndex]);
  }
);

/**
 * PATCH /products/:id/stock
 * Update product stock (increment or decrement)
 *
 * Body:
 *   - amount: number (positive to add, negative to subtract)
 */
router.patch(
  '/:id/stock',
  validateRequest({
    amount: { type: 'number', required: true }
  }),
  (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { amount } = req.body;
    const newStock = product.stock + amount;

    if (newStock < 0) {
      return res.status(400).json({
        error: 'Insufficient stock',
        current: product.stock,
        requested: amount
      });
    }

    product.stock = newStock;
    product.updatedAt = new Date().toISOString();

    res.json({
      id: product.id,
      name: product.name,
      stock: product.stock,
      change: amount
    });
  }
);

/**
 * DELETE /products/:id
 * Delete a product
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products.splice(productIndex, 1);
  res.status(204).send();
});

module.exports = router;
