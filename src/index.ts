const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

import { Request, Response, NextFunction } from "express";
dotenv.config();
const { teacherRouter } = require("./controllers/teahers.controller");
const cors = require("cors");
const prisma = new PrismaClient();
const app = express();
app.use(cors());

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/teachers", teacherRouter);

function authenticateToken(req: any, res: any, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401); // No token provided

  jwt.verify(token, process.env.TOKEN_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user; // Save user info for use in other routes
    next();
  });
}

app.post("/signup", async (req: Request, res: Response) => {
  const { email, password, role, name, phone } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        phone,
        name,
      },
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: "User already exists or invalid data" });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
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

  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
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

app.get("/students", authenticateToken, async (req: Request, res: Response) => {
  const students = await prisma.student.findMany();
  res.json(students);
});

app.get(
  "/students/:id/records",
  authenticateToken,
  async (req: Request, res: Response) => {
    const student_id = req.params?.id;
    try {
      const records_data = await prisma.records.findMany({
        where: { payedBy: student_id },
      });
      return res.json({ data: records_data }).status(200);
    } catch (error) {
      return res.json(error).status(400);
    }
  }
);

app.get(
  "/students/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const students = await prisma.student.findUnique({
      where: { id: parseInt(id) },
    });
    res.json(students);
  }
);

app.put(
  "/students/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const { name, age, parentPhone, classId, gender } = req.body;
    try {
      const updatedStudent = await prisma.student.update({
        where: { id: parseInt(id) },
        data: {
          name,
          age,
          parentPhone,
          classId,
          gender,
        },
      });
      res.json(updatedStudent);
    } catch (error) {
      res.status(400).json({ error: `Error updating student ${error}` });
    }
  }
);

app.post(
  "/students",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { name, age, parentPhone, classId, gender } = req.body;

    try {
      const newStudent = await prisma.student.create({
        data: {
          name,
          age,
          parentPhone,
          classId,
          gender,
        },
      });
      res.status(201).json(newStudent);
    } catch (error) {
      res.status(400).json({ error: `Error creating student: ${error}` });
    }
  }
);

app.get("/records", authenticateToken, async (req: any, res: any) => {
  const records = await prisma.record.findMany();
  res.json(records);
});

app.post("/records", authenticateToken, async (req: any, res: any) => {
  const { amount, submiter_email, student_name, isPrepaid } = req.body;

  try {
    const payer = await prisma.student.findUnique({
      where: { name: student_name },
    });
    const submiter = await prisma.user.findUnique({
      where: { email: submiter_email },
    });
    const newRecord = await prisma.record.create({
      data: {
        amount,
        submitedBy: submiter.id,
        payedBy: payer.id,
        isPrepaid,
      },
    });
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(400).json({ error, message: "There was an error" });
  }
});

// Delete enpoints requests - students, classes, teachers and records
app.delete(
  "/students/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      await prisma.student.delete({
        where: { id: parseInt(id) },
      });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: `Error deleting student: ${error}` });
    }
  }
);

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

// Start the server
const server = app.listen(3400, () =>
  console.log(`
🚀 Server ready at: http://localhost:3400
⭐️ See sample requests`)
);
