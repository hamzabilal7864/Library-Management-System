const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  // Get the token from the Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  // If no token is provided, send a 401 (Unauthorized) response
  if (!token) {
    return res.status(401).json({ message: 'Access denied, no token provided.' });
  }

  try {
    // Verify the token using the secret key (stored in the .env file)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Store the decoded user information in the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // If the token is invalid or expired, return a 400 (Bad Request) response
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = verifyToken;
