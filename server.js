const express = require('express');
const cors = require('cors');
const path = require('node:path');
const crypto = require('node:crypto');
const { db, hashPassword, verifyPassword, generateToken, verifyToken } = require('./database');
const seedDatabase = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware helper
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Token required.' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
  req.user = payload;
  next();
}

// Optional Auth middleware (attach user if token provided, but allow guest)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    req.user = verifyToken(token) || null;
  } else {
    req.user = null;
  }
  next();
}

// Shared input validation helpers
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_NAME_LEN = 80;
const MAX_ADDRESS_LEN = 200;

function normalizeEmail(value) {
  return String(value || '').toLowerCase().trim();
}

function isValidEmail(value) {
  return EMAIL_RE.test(normalizeEmail(value));
}

// Trim and cap a free-text field, returning null when it is empty.
function cleanText(value, maxLength) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (password.length > 200) {
      return res.status(400).json({ error: 'Password must be under 200 characters.' });
    }
    const cleanName = cleanText(name, MAX_NAME_LEN);
    if (!cleanName) {
      return res.status(400).json({ error: 'Please enter a valid name.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const cleanEmail = normalizeEmail(email);

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`;
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, avatar)
      VALUES (?, ?, ?, 'customer', ?)
    `).run(cleanName, cleanEmail, hashPassword(password), defaultAvatar);

    const user = {
      id: Number(result.lastInsertRowid),
      name: cleanName,
      email: cleanEmail,
      role: 'customer',
      avatar: defaultAvatar
    };

    const token = generateToken(user);
    res.status(201).json({ message: 'Registration successful', user, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email));
    if (!userRow) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let isValid = false;
    try {
      isValid = verifyPassword(password, userRow.password_hash);
    } catch (hashErr) {
      // Malformed stored hash must read as a failed login, not a 500.
      isValid = false;
    }
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      avatar: userRow.avatar
    };

    const token = generateToken(user);
    res.json({ message: 'Login successful', user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== PRODUCT ROUTES ====================

// List products with category, search, and sorting
app.get('/api/products', (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim() !== '') {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (sort === 'price_asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY price DESC';
    } else if (sort === 'rating') {
      query += ' ORDER BY rating DESC';
    } else {
      query += ' ORDER BY id DESC';
    }

    const products = db.prepare(query).all(...params).map(p => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : []
    }));

    // Categories summary list
    const categoriesRows = db.prepare('SELECT DISTINCT category FROM products ORDER BY category ASC').all();
    const categories = ['All', ...categoriesRows.map(r => r.category)];

    res.json({ products, categories, count: products.length });
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Single product details
app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.features = product.features ? JSON.parse(product.features) : [];
    const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC').all(req.params.id);

    res.json({ product, reviews });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add review to product
app.post('/api/products/:id/reviews', optionalAuth, (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Invalid product id.' });
    }

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { rating, comment } = req.body;

    if (rating === undefined || rating === null || rating === '') {
      return res.status(400).json({ error: 'Rating and comment are required.' });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be a whole number between 1 and 5.' });
    }

    const cleanComment = cleanText(comment, 2000);
    if (!cleanComment) {
      return res.status(400).json({ error: 'Please write a review before submitting.' });
    }

    const reviewerName = req.user ? req.user.name : 'Verified Buyer';
    db.prepare(`
      INSERT INTO reviews (product_id, user_name, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(productId, reviewerName, Math.round(numericRating), cleanComment);

    // Update product rating and reviews count
    const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE product_id = ?').get(productId);
    db.prepare('UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?').run(
      Math.round(stats.avg_rating * 10) / 10,
      stats.total_reviews,
      productId
    );

    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ==================== ORDER ROUTES ====================

// Process new checkout order
app.post('/api/orders', optionalAuth, (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      shippingAddress,
      city,
      postalCode,
      paymentMethod,
      items,
      couponCode
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }
    if (items.length > 50) {
      return res.status(400).json({ error: 'Too many items in a single order.' });
    }

    const cleanName = cleanText(customerName, MAX_NAME_LEN);
    const cleanEmail = normalizeEmail(customerEmail);
    const cleanAddress = cleanText(shippingAddress, MAX_ADDRESS_LEN);
    const cleanCity = cleanText(city, MAX_NAME_LEN);
    const cleanPostal = cleanText(postalCode, 20);

    if (!cleanName || !cleanEmail || !cleanAddress || !cleanCity) {
      return res.status(400).json({ error: 'Please provide full shipping details and items.' });
    }
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address for your receipt.' });
    }

    // Calculate live totals from database items
    let subtotal = 0;
    const verifiedItems = [];
    // Guard against the same product being listed twice to bypass the per-line
    // stock check by splitting the quantity across lines.
    const requestedQty = new Map();

    for (const item of items) {
      const productId = Number(item.id);
      if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({ error: 'Your cart contains an invalid item.' });
      }

      const product = db.prepare('SELECT id, name, price, stock, image_url FROM products WHERE id = ?').get(productId);
      if (!product) {
        return res.status(400).json({ error: `Product ID ${productId} not found.` });
      }

      const rawQty = Number(item.quantity);
      if (!Number.isFinite(rawQty) || rawQty < 1) {
        return res.status(400).json({ error: `Invalid quantity for "${product.name}".` });
      }
      const qty = Math.floor(rawQty);
      if (qty > 99) {
        return res.status(400).json({ error: `Maximum 99 units per product ("${product.name}").` });
      }

      // Merge duplicate lines before validating against stock.
      const existing = verifiedItems.find(v => v.id === productId);
      const mergedQty = (requestedQty.get(productId) || 0) + qty;
      requestedQty.set(productId, mergedQty);

      if (product.stock <= 0) {
        return res.status(400).json({ error: `Sorry, "${product.name}" is currently out of stock.` });
      }
      if (product.stock < mergedQty) {
        return res.status(400).json({ error: `Sorry, "${product.name}" only has ${product.stock} items remaining in stock.` });
      }

      if (existing) {
        existing.quantity = mergedQty;
      } else {
        verifiedItems.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          image_url: product.image_url
        });
      }
      subtotal += product.price * qty;
    }

    // Apply promo coupon if applicable (e.g. ALPHA10 for 10% off)
    let discount = 0;
    if (couponCode && couponCode.toUpperCase().trim() === 'ALPHA10') {
      discount = Math.round(subtotal * 0.10 * 100) / 100;
    }

    const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100; // 8% sales tax
    const shipping = subtotal > 100 ? 0.00 : 9.99; // Free shipping over $100
    const total = Math.round((subtotal - discount + tax + shipping) * 100) / 100;

    // Whitelist payment methods so arbitrary strings are not persisted.
    const ALLOWED_PAYMENT_METHODS = ['Credit Card', 'Cash on Delivery'];
    const resolvedPaymentMethod = ALLOWED_PAYMENT_METHODS.includes(paymentMethod)
      ? paymentMethod
      : 'Cash on Delivery';

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(1000, 10000)}`;
    const userId = req.user ? req.user.id : null;

    // Insert order record
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, customer_name, customer_email,
        shipping_address, city, postal_code, payment_method,
        subtotal, tax, shipping, discount, total, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
    `);

    const orderResult = insertOrder.run(
      orderNumber,
      userId,
      cleanName,
      cleanEmail,
      cleanAddress,
      cleanCity,
      cleanPostal || '00000',
      resolvedPaymentMethod,
      subtotal,
      tax,
      shipping,
      discount,
      total
    );

    const orderId = Number(orderResult.lastInsertRowid);

    // Insert order items and deduct stock.
    // Wrapped in a transaction: a failure part-way through must not leave the
    // customer charged for an incomplete order with stock already deducted.
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?');

    db.exec('BEGIN IMMEDIATE');
    try {
      for (const vItem of verifiedItems) {
        insertItem.run(orderId, vItem.id, vItem.name, vItem.price, vItem.quantity, vItem.image_url);
        updateStock.run(vItem.quantity, vItem.id);
      }
      db.exec('COMMIT');
    } catch (itemErr) {
      db.exec('ROLLBACK');
      console.error('Order item insertion failed, transaction rolled back:', itemErr);
      return res.status(500).json({ error: 'Failed to process order. No changes were made.' });
    }

    res.status(201).json({
      message: 'Order processed successfully!',
      orderNumber,
      order: {
        id: orderId,
        order_number: orderNumber,
        customer_name: cleanName,
        customer_email: cleanEmail,
        shipping_address: cleanAddress,
        city: cleanCity,
        postal_code: cleanPostal || '00000',
        payment_method: resolvedPaymentMethod,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        status: 'Confirmed',
        items: verifiedItems,
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Order processing error:', err);
    res.status(500).json({ error: 'Failed to process order.' });
  }
});

// Get user order history
app.get('/api/orders', authMiddleware, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
    for (const ord of orders) {
      ord.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id);
    }
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by order_number
// Requires auth: order numbers are guessable (timestamp + 4 digits), so this
// endpoint would otherwise expose customer name, email and address to anyone
// who can enumerate them.
app.get('/api/orders/:orderNumber', authMiddleware, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    // Guest checkout orders have no owner; only the matching account may read them.
    if (order.user_id !== null && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this order.' });
    }
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Unknown API routes must return JSON, not the SPA shell.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Fallback to index.html for SPA-friendly behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CodeAlpha Task 1: E-commerce Store Server running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`👤 Demo Account: demo@codealpha.com | password123`);
  console.log(`=======================================================`);
});
