// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Check for the authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;  // Store the user ID in the request object
    next();  // Move to the next middleware or route handler
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
