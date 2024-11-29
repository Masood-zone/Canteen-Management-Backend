const express = require("express");
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const studentRouter = express.Router();

studentRouter.get("/", async (req: any, res: any) => {
  try {
    const result = await prisma.student.findMany();
    return res.status(200).json({ students: result });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

studentRouter.post("/", async (req: any, res: any) => {
  const { name, age, parentPhone, classId, gender } = req.body;
  try {
    const data = await prisma.student.create({
      data: {
        name,
        age,
        parentPhone,
        classId,
        gender,
      },
    });
    return res
      .status(200)
      .json({ status: "Student added successfully", data: data });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

studentRouter.get("/:id", async (req: any, res: any) => {
  const id = req.params.id;
  try {
    const result = await prisma.student.findUnique({
      where: { id: id },
    });
    return res.status(200).json({ student: result });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

studentRouter.get("/:id/records", async (req: any, res: any) => {
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
});

studentRouter.put("/:id", async (req: any, res: any) => {
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

module.exports = { studentRouter };
