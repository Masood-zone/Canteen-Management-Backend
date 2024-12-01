const express = require("express");
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "..";

const prisma = new PrismaClient();
const studentRouter = express.Router();

// Get all students
studentRouter.get("/", authenticateToken, async (req: any, res: any) => {
  try {
    const result = await prisma.student.findMany();
    return res.status(200).json({ students: result });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
// Get students in a class
studentRouter.get(
  "/class/:id",
  authenticateToken,
  async (req: any, res: any) => {
    const classId = req.params.id;
    try {
      const result = await prisma.student.findMany({
        where: { classId: parseInt(classId) },
      });
      return res.status(200).json({ students: result });
    } catch (error) {
      console.error("Error fetching students:", error);
      return res
        .status(500)
        .json({ message: `Internal Server Error ${error}` });
    }
  }
);
// Add a student
studentRouter.post("/", authenticateToken, async (req: any, res: any) => {
  const { name, age, parentPhone, classId, gender } = req.body;
  try {
    // Ensure classId exists in the Class table
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      return res
        .status(400)
        .json({ message: "Invalid classId. Class does not exist." });
    }
    const data = await prisma.student.create({
      data: {
        name,
        age,
        parentPhone,
        classId,
        gender,
      },
    });
    return res.status(200).json({ status: "Student added successfully", data });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({ message: `Internal Server Error ${error}` });
  }
});
// Get a student
studentRouter.get("/:id", authenticateToken, async (req: any, res: any) => {
  const id = req.params.id;
  try {
    const result = await prisma.student.findUnique({
      where: { id: parseInt(id) },
    });
    return res.status(200).json({ student: result });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({ message: `Internal Server Error ${error}` });
  }
});
// Get a student's records
studentRouter.get(
  "/:id/records",
  authenticateToken,
  async (req: any, res: any) => {
    const student_id = req.params.id;
    try {
      const result = await prisma.record.findMany({
        where: { payedBy: student_id },
      });
      return res.status(200).json({ records: result });
    } catch (error) {
      console.error("Error fetching students:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);
// Update a student
studentRouter.put("/:id", authenticateToken, async (req: any, res: any) => {
  const id = req.params.id;
  const { name, age, parentPhone, classId, gender } = req.body;
  try {
    const data = await prisma.student.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(age && { age }),
        ...(parentPhone && { parentPhone }),
        ...(classId && { classId }),
        ...(gender && { gender }),
      },
    });
    return res
      .status(200)
      .json({ status: "Student updated successfully", data: data });
  } catch (error) {
    console.error("Error updating student:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
// Delete a student
studentRouter.delete("/:id", authenticateToken, async (req: any, res: any) => {
  const id = req.params.id;
  try {
    const data = await prisma.student.delete({
      where: { id: parseInt(id) },
    });
    return res
      .status(200)
      .json({ status: "Student deleted successfully", data: data });
  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = { studentRouter };
