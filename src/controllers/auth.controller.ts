const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt"); // Don't forget to require bcrypt
const dotenv = require("dotenv");

dotenv.config();

const authRouter = express.Router(); // Create a new router

// Sample in-memory user storage (replace with a database in production)
let users = [];

// Function to generate JWT
function generateAccessToken(user) {
  return jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: "1800s" });
}

// Register route
authRouter.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  // Check if user already exists
  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = { email, password: hashedPassword, name };
  users.push(newUser);

  res.status(201).json({ message: "User registered successfully" });
});

// Login route
authRouter.post("/login", async (req:any, res:any) => {
  const { email, password } = req.body;

  // Find user by email
  const user = users.find((user:any) => user.email === email);
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Generate JWT token
  const token = generateAccessToken({ email: user.email });

  res.json({ token });
});

// Middleware to authenticate token
function authenticateToken(req:any, res:any, next:any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401); // No token provided

  jwt.verify(token, process.env.TOKEN_SECRET, (err:any, user:any) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user; // Save user info for use in other routes
    next();
  });
}

// Protected route example
authRouter.get("/protected", authenticateToken, (req:any, res:any) => {
  res.json({ message: "This is a protected route", user: req.user });
});

module.exports = authRouter; // Export the router using CommonJS syntax
