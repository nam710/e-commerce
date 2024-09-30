// routes/orderRoutes.js
const express = require('express');
const db = require('../db');
const auth = require('../middleware/authMiddleware'); // Import the auth middleware
const router = express.Router();

// Get user orders (protected route)
router.get('/', auth, (req, res) => {
  const userId = req.user; // Extract user ID from the JWT token

  const query = 'SELECT * FROM orders WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Place a new order (protected route)
router.post('/', auth, (req, res) => {
  const userId = req.user;  // Get user ID from the token
  const { total, items } = req.body;  // Get order total and items from request

  // Insert new order into the orders table
  const insertOrderQuery = 'INSERT INTO orders (user_id, total) VALUES (?, ?)';
  db.query(insertOrderQuery, [userId, total], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const orderId = result.insertId;

    // Prepare query for inserting multiple order items
    const insertOrderItemQuery = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?';
    const orderItemsData = items.map(item => [
      orderId, item.product_id, item.quantity, item.price
    ]);

    // Insert the items into the order_items table
    db.query(insertOrderItemQuery, [orderItemsData], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Order placed successfully', orderId });
    });
  });
});

module.exports = router;
