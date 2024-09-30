// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const router = express.Router();

// User Registration
router.post(
  '/register',
  [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      const userExistsQuery = 'SELECT email FROM users WHERE email = ?';
      db.query(userExistsQuery, [email], async (err, result) => {
        if (result.length > 0) {
          return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save user to the database
        const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(insertUserQuery, [name, email, hashedPassword], (err, result) => {
          if (err) throw err;

          const payload = { userId: result.insertId };
          const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

          res.status(201).json({ token });
        });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// User Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user by email
      const userQuery = 'SELECT * FROM users WHERE email = ?';
      db.query(userQuery, [email], async (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = results[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create and return JWT
        const payload = { userId: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
