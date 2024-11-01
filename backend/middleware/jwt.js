const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // Check if token is missing
  if (!token) return res.status(401).json({ error: "Access token required" });

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });

    // Attach user information to the request object
    req.user = user;
    next();
  });
};

// Function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
};

module.exports = { authenticateToken, generateToken };
