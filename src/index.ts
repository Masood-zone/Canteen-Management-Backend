const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

import { Request, Response, NextFunction } from "express";
import {
  createAmount,
  createUser,
  getAmount,
  getClassBySupervisorId,
  submitPrepaid,
  updateAmount,
} from "../services/prisma.queries";
dotenv.config();

import userRouter from "./controllers/users.controller";
const { teacherRouter } = require("./controllers/teahers.controller");
const { studentRouter } = require("./controllers/student.controller");
import cors from "cors";
import {
  getPresetAmount,
  getRecordsByClass,
  submitStudentRecord,
} from "./controllers/records.controller";
const prisma = new PrismaClient();
const app = express();

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/teachers", teacherRouter);
app.use("/users", userRouter);
app.use("/students", studentRouter);

export function authenticateToken(req: any, res: any, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401); // No token provided

  jwt.verify(token, process.env.TOKEN_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(401); // Invalid token
    req.user = user; // Save user info for use in other routes
    next();
  });
}

app.post("/signup", async (req: Request, res: Response) => {
  const { email, password, role, name, phone } = req.body;

  if (!email || !password || !role || !name || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const toSave = {
    email: email,
    password: hashedPassword,
    role: role,
    name: name,
    phone: phone,
  };
  try {
    const result = await createUser(toSave);
    res
      .status(201)
      .json({ message: "user created successfully", data: result });
  } catch (error) {
    res.status(400).json({ error: "User already exists or invalid data" });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(400).json({ error: "User not found!" });
  }

  // Validate password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.TOKEN_SECRET as string,
    { expiresIn: "2d" }
  );

  // Fetch assigned class
  const assignedClass = await prisma.class.findFirst({
    where: { supervisorId: user.id },
  });

  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword, assigned_class: assignedClass });
});

app.get("/classes", authenticateToken, async (req: Request, res: Response) => {
  const classes = await prisma.class.findMany();
  res.json(classes);
});

app.put("/classes/:name/assign", async (req: Request, res: any) => {
  const class_name = req.params.name;
  const { teacher_email } = req.body;

  // Validate input
  if (!class_name || !teacher_email) {
    return res
      .status(400)
      .json({ message: "Class name and teacher email are required." });
  }

  try {
    const teacher = await prisma.user.findUnique({
      where: { email: teacher_email },
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    const updatedClass = await prisma.class.update({
      where: { name: class_name },
      data: {
        supervisorId: teacher.id,
      },
    });

    return res
      .status(200)
      .json({ message: "User assigned successfully", updatedClass });
  } catch (error) {
    console.error("Error assigning teacher:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});

app.get("/classes/:id/supervisor", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data = await getClassBySupervisorId(id);
    return res.json({ supervisor: data });
  } catch (err) {
    return res.json({ err }).status(500);
  }
});

app.get("/classes/:id", async (req: Request, res: any) => {
  const class_id = req.params.id;

  // Validate input
  if (!class_id) {
    return res
      .status(400)
      .json({ message: "Class id is required but it's not provided" });
  }

  try {
    const current_class = await prisma.class.findUnique({
      where: { id: Number(class_id) },
    });
    if (!current_class) {
      return res.json({ message: "class not found" }).status(400);
    }

    return res.status(201).json({ current_class });
  } catch (error) {
    console.error("Error assigning teacher:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});

app.post("/classes", authenticateToken, async (req: Request, res: Response) => {
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
app.put(
  "/classes/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const { name, description, supervisorId } = req.body;

    try {
      const updatedClass = await prisma.class.update({
        where: {
          id: parseInt(id),
        },
        data: {
          name,
          description,
          supervisorId,
        },
      });
      res.json(updatedClass);
    } catch (error) {
      res.status(400).json({ error: `Error updating class ${error}` });
    }
  }
);

// Settings endpoints
app.get("/settings/amount", async (req: any, res: any) => {
  try {
    const data = await getAmount();
    return res.status(200).json({ data: data }); // Set status before sending JSON
  } catch (err) {
    console.error("Error fetching amount:", err); // Log the error for debugging
    return res.status(400).json({ err }); // Send a user-friendly error message
  }
});

app.post("/settings/amount", async (req: any, res: any) => {
  const { value } = req.body;
  const amount = parseFloat(value);
  // Check if conversion was unsuccessful
  if (isNaN(amount)) {
    return res.status(400).json({ error: "Invalid amount: must be a number" });
  }

  try {
    const data = await createAmount(amount);
    return res.status(200).json({ data: data }); // Correct order of response methods
  } catch (err) {
    return res.status(400).json(err);
  }
});

app.put("/settings/amount", async (req: any, res: any) => {
  const { amount } = req.body;
  // Check if conversion was unsuccessful
  if (isNaN(amount)) {
    return res.status(400).json({ error: "Invalid amount: must be a number" });
  }

  try {
    const data = await updateAmount(amount);
    return res.status(200).json({ data: data });
  } catch (err) {
    return res.status(400).json(err);
  }
});

// Records endpoints

// Get all records for a class on a specific date
app.get(
  "/records/:classId",
  authenticateToken,
  async (req: Request, res: Response) => {
    const classId = parseInt(req.params.classId);
    const date = new Date(req.query.date as string);

    if (isNaN(classId) || isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid classId or date" });
    }

    try {
      const records = await getRecordsByClass(classId, date);
      res.status(200).json(records);
    } catch (error) {
      console.error("Error fetching records:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
// Submit student record endpoint
app.post("/records", authenticateToken, async (req: Request, res: Response) => {
  try {
    const record = await submitStudentRecord(req.body);
    res.status(201).json(record);
  } catch (error) {
    console.error("Error submitting student record:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Canteen amount endpoint
app.get("/preset-amount", async (req: any, res: any) => {
  const amount = await getPresetAmount();
  res.json({ amount });
});

// Delete enpoints requests - classes, teachers and records
app.delete(
  "/classes/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      await prisma.class.delete({
        where: { id: parseInt(id) },
      });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: `Error deleting class: ${error}` });
    }
  }
);

app.delete(
  "/records/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      await prisma.record.delete({
        where: { id: parseInt(id) },
      });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: `Error deleting record: ${error}` });
    }
  }
);

app.delete(
  "/teachers/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      await prisma.user.delete({
        where: { id: parseInt(id) },
      });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: `Error deleting teacher: ${error}` });
    }
  }
);
// Start the server
const server = app.listen(3400, () =>
  console.log(`
🚀 Server ready at: http://localhost:3400
⭐️ See sample requests`)
);
