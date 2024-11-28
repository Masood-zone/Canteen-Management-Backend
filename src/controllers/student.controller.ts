const express = require("express");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

dotenv.config();

const prisma = new PrismaClient();
const studentRouter = express.Router();


// Get All Students Route (Protected)
studentRouter.get("/students",  async (req:Request, res:Response) => {
  const students = await prisma.student.findMany();
  res.json(students);
});

// Create Student Route (Protected)
studentRouter.post("/students", async (req:Request, res:Response) => {
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

module.exports = {studentRouter}