const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt"); // For password hashing
const jwt = require("jsonwebtoken"); // For JWT authentication
const dotenv = require("dotenv");
import { Request, Response, NextFunction } from "express";
dotenv.config();
const {teacherRouter} = require('./controllers/teahers.controller')
const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use('/teachers', teacherRouter)
// Middleware to authenticate token
function authenticateToken(req:any, res:any, next:NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401); // No token provided

  jwt.verify(token, process.env.TOKEN_SECRET, (err:any, user:any) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user; // Save user info for use in other routes
    next();
  });
}

// User Signup Route
app.post("/signup", async (req:Request, res:Response) => {
  const {  email, password, role } = req.body;

  // Hash the password before saving it
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: "User already exists or invalid data" });
  }
});

// User Login Route
app.post("/login", async (req:Request, res:Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.TOKEN_SECRET,
    { expiresIn: "1800s" }
  );

  res.json({ token });
});

// Get All Classes Route (Protected)
app.get("/classes", authenticateToken, async (req:Request, res:Response) => {
  const classes = await prisma.class.findMany();
  res.json(classes);
});

// Create Class Route (Protected)
app.post("/classes", authenticateToken, async (req:Request, res:Response) => {
  const { name, description, supervisorId } = req.body;

  try {
    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        supervisorId,
      },
    });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ error: "Error creating class" });
  }
});

// Get All Students Route (Protected)
app.get("/students", authenticateToken, async (req:Request, res:Response) => {
  const students = await prisma.student.findMany();
  res.json(students);
});

// Create Student Route (Protected)
app.post("/students", authenticateToken, async (req:Request, res:Response) => {
  const { name, age, parentPhone, classId } = req.body;

  try {
    const newStudent = await prisma.student.create({
      data: {
        name,
        age,
        parentPhone,
        classId,
      },
    });
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(400).json({ error: "Error creating student" });
  }
});

// Get All Records Route (Protected)
app.get("/records", authenticateToken, async (req:any, res:any) => {
  const records = await prisma.record.findMany();
  res.json(records);
});

// Create Record Route (Protected)
app.post("/records", authenticateToken, async (req:any, res:any) => {
  const { amount, submitedBy } = req.body;

  try {
    const newRecord = await prisma.record.create({
      data: {
        amount,
        submitedBy,
      },
    });
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(400).json({ error: "Error creating record" });
  }
});

// Start the server
const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests`)
);
