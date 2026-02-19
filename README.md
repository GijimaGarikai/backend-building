# Event 2: Scaffolding the Backend

**Tangible Skill:** Structure a backend with proper separation of concerns, validation, and error handling patterns.

## Quick Start

```bash
npm install
npm start
```

Server runs at `http://localhost:3000`.

## Why This Matters

At hackathons, you need to move fast. Having a clear project structure lets you add features without creating a mess. This event provides patterns for organizing routes, middleware, and validation that scale from prototype to production.

## Project Structure

```
event2-scaffolding-the-backend/
├── index.js                    # Server setup and middleware configuration
├── routes/                     # Route handlers by resource
│   ├── health.js              # Health check
│   ├── items.js               # Simple CRUD (basic pattern)
│   ├── users.js               # CRUD with validation and filtering
│   ├── products.js            # Advanced filtering, sorting, pagination
│   └── orders.js              # Async handlers and state management
├── middleware/                 # Reusable middleware
│   ├── errorHandler.js        # Centralized error handling
│   ├── logger.js              # Request logging
│   ├── validator.js           # Input validation
│   └── asyncHandler.js        # Async error handling wrapper
├── package.json
└── .gitignore
```

## Architecture Principles

### Separation of Concerns
- **Routes**: Define endpoints and wire up middleware
- **Controllers**: Handle business logic (optional, can inline for speed)
- **Middleware**: Reusable logic applied across routes
- **Models**: Data structures (Event 3 adds database layer)

### Why This Structure?
- **Scalability**: Easy to add new routes without modifying existing code
- **Maintainability**: Each file has a single responsibility
- **Testability**: Components can be tested in isolation
- **Team collaboration**: Multiple developers can work on different routes

## Core Patterns

### Pattern 1: Basic CRUD

See `routes/items.js:1` for the simplest CRUD implementation:

```javascript
// GET all
router.get('/', (req, res) => {
  res.json(items);
});

// GET one
router.get('/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// POST (create)
router.post('/', (req, res) => {
  const newItem = { id: generateId(), ...req.body };
  items.push(newItem);
  res.status(201).json(newItem);
});

// PUT (update)
router.put('/:id', (req, res) => {
  // Update logic
});

// DELETE
router.delete('/:id', (req, res) => {
  // Delete logic
  res.status(204).send();
});
```

### Pattern 2: Validation Middleware

See `middleware/validator.js:1` for implementation.

```javascript
router.post(
  '/users',
  validateRequest({
    username: { type: 'string', minLength: 3, required: true },
    email: { type: 'email', required: true },
    role: { type: 'string', enum: ['user', 'admin'], default: 'user' }
  }),
  (req, res) => {
    // req.body is validated at this point
    const user = createUser(req.body);
    res.status(201).json(user);
  }
);
```

**Validation features:**
- Type checking (string, number, boolean, array, object, email)
- Required fields
- Min/max length for strings
- Min/max values for numbers
- Enum validation
- Default values
- Nested array validation

### Pattern 3: Query Parameters

Filtering, sorting, and pagination (`routes/products.js:22`):

```javascript
// GET /products?category=electronics&minPrice=100&sort=price&order=asc&page=1&limit=10

router.get('/', (req, res) => {
  const { category, minPrice, maxPrice, sort, order, page, limit } = req.query;

  let results = [...products];

  // Filter
  if (category) results = results.filter(p => p.category === category);
  if (minPrice) results = results.filter(p => p.price >= parseFloat(minPrice));

  // Sort
  results.sort((a, b) => {
    return order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort];
  });

  // Paginate
  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  res.json({
    page,
    limit,
    total: results.length,
    results: paginated
  });
});
```

### Pattern 4: Async Handlers

For async operations (database queries, API calls), use async handler wrapper (`routes/orders.js:1`):

```javascript
const { asyncHandler } = require('../middleware/asyncHandler');

router.get('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
}));
```

**Why?** Without the wrapper, you need try-catch in every async route:

```javascript
// Without wrapper (repetitive)
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

The async handler automatically catches errors and passes them to error middleware.

### Pattern 5: Error Handling

Centralized error handler (`middleware/errorHandler.js:1`):

```javascript
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
```

**Usage in routes:**
```javascript
// Throw errors, let middleware handle them
if (!user) {
  const error = new Error('User not found');
  error.status = 404;
  throw error;
}
```

### Pattern 6: Request Logging

Log all requests with timing (`middleware/logger.js:1`):

```
[2024-01-08T12:00:00.000Z] GET /products
[2024-01-08T12:00:00.150Z] GET /products - 200 (150ms)
```

Useful for debugging and monitoring performance.

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/health
```

### Items (Basic CRUD)

```bash
# Get all
curl http://localhost:3000/items

# Get one
curl http://localhost:3000/items/1

# Create
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Build API"}'

# Update
curl -X PUT http://localhost:3000/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated", "completed": true}'

# Delete
curl -X DELETE http://localhost:3000/items/1
```

### Users (Validation & Filtering)

```bash
# Get all users
curl http://localhost:3000/users

# Filter by role
curl "http://localhost:3000/users?role=admin"

# Search
curl "http://localhost:3000/users?search=alice"

# Create user (with validation)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "charlie",
    "email": "charlie@example.com",
    "role": "user"
  }'

# Update user (partial)
curl -X PATCH http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### Products (Advanced Filtering)

```bash
# Get all products
curl http://localhost:3000/products

# Filter and paginate
curl "http://localhost:3000/products?category=electronics&minPrice=500&sort=price&order=desc&page=1&limit=5"

# Create product
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "price": 29.99,
    "category": "electronics",
    "stock": 100
  }'

# Update stock
curl -X PATCH http://localhost:3000/products/1/stock \
  -H "Content-Type: application/json" \
  -d '{"amount": -5}'
```

### Orders (Async & State Management)

```bash
# Get all orders
curl http://localhost:3000/orders

# Filter by user
curl "http://localhost:3000/orders?userId=1"

# Create order
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      {"productId": 1, "quantity": 2, "price": 29.99}
    ]
  }'

# Update order status
curl -X PATCH http://localhost:3000/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "processing"}'

# Cancel order
curl -X DELETE http://localhost:3000/orders/1
```

## Common Patterns

### Pattern: Unique Constraint Validation

```javascript
// Check if username already exists
if (users.find(u => u.username === username)) {
  return res.status(409).json({ error: 'Username already exists' });
}
```

Status code 409 (Conflict) indicates the request conflicts with existing data.

### Pattern: Partial Updates (PATCH vs PUT)

**PUT**: Full replacement
```javascript
router.put('/:id', (req, res) => {
  // Requires ALL fields
  const { name, email, role } = req.body;
  user = { id, name, email, role, updatedAt: new Date() };
});
```

**PATCH**: Partial update
```javascript
router.patch('/:id', (req, res) => {
  // Only update provided fields
  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  user.updatedAt = new Date();
});
```

### Pattern: State Transitions

Validate state changes (`routes/orders.js:98`):

```javascript
const validTransitions = {
  pending: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

if (!validTransitions[currentStatus].includes(newStatus)) {
  return res.status(400).json({
    error: 'Invalid status transition',
    allowed: validTransitions[currentStatus]
  });
}
```

### Pattern: Nested Resource Updates

```javascript
// Update specific nested property
router.patch('/:id/stock', (req, res) => {
  const product = findProduct(req.params.id);
  product.stock += req.body.amount;
  res.json({ stock: product.stock });
});
```

## Middleware Execution Order

Middleware runs in the order it's defined:

```javascript
app.use(cors());                    // 1. Enable CORS
app.use(express.json());           // 2. Parse JSON bodies
app.use(logger);                   // 3. Log requests

app.use('/users', usersRouter);    // 4. Route-specific middleware

app.use((req, res) => {            // 5. 404 handler
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);             // 6. Error handler (must be last)
```

## Response Status Codes

Use appropriate HTTP status codes:

- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST (resource created)
- **204 No Content**: Successful DELETE (no response body)
- **400 Bad Request**: Invalid input/validation error
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Authenticated but not allowed
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource conflict (duplicate)
- **422 Unprocessable Entity**: Semantic errors
- **500 Internal Server Error**: Server-side error

## Best Practices

### Project Organization
- One route file per resource (users, products, orders)
- Keep routes thin, move complex logic to controllers/services
- Group related middleware in the middleware directory
- Use meaningful names (userRouter, not router1)

### Validation
- Validate all input at API boundaries
- Return specific error messages
- Use validation middleware to avoid repetition
- Validate both type and business rules

### Error Handling
- Use centralized error handler
- Don't expose sensitive error details in production
- Log errors for debugging
- Return consistent error format

### Performance
- Use pagination for large datasets
- Add indexes for filtered/sorted fields (Event 3)
- Avoid N+1 queries (Event 3)
- Cache expensive operations (Event 1)

## Extending This Structure

### Adding a New Resource

1. Create route file: `routes/comments.js`
2. Define CRUD operations
3. Add validation if needed
4. Register in `index.js`:
```javascript
const commentsRouter = require('./routes/comments');
app.use('/comments', commentsRouter);
```

### Adding Middleware

1. Create middleware file: `middleware/auth.js`
2. Export middleware function
3. Apply globally or per-route:
```javascript
// Global
app.use(authMiddleware);

// Per-route
router.post('/', authMiddleware, createHandler);

// Per-router
app.use('/admin', authMiddleware, adminRouter);
```

### Environment Configuration

```javascript
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Use different configs for different environments
const config = {
  development: { /* ... */ },
  production: { /* ... */ }
}[NODE_ENV];
```

## Next Steps

In **Event 3**, we'll replace in-memory data stores with a real database, add SQL queries with JOINs, and implement transactions.
