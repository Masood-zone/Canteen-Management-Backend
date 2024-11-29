import { getAllTeachers } from "../../services/prisma.queries";

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

dotenv.config();
var cors = require("cors");
const prisma = new PrismaClient();
const teacherRouter = express.Router();

// Get all teachers
teacherRouter.get("/", async (req: any, res: any) => {
  try {
    const result = await getAllTeachers();

    return res.status(200).json({ teachers: result });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get a specific teacher
teacherRouter.get("/:id", async (req: any, res: any) => {
  const id = parseInt(req.params.id, 10); // Ensure id is an integer
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid teacher ID" });
  }
  try {
    const teacher = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    return res.json({ data: teacher });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get records for a specific teacher
teacherRouter.get("/:id/records", async (req: any, res: any) => {
  const id = parseInt(req.params.id, 10); // Ensure id is an integer

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid teacher ID" });
  }

  try {
    const records_data = await prisma.record.findMany({
      where: {
        submitedBy: id,
      },
    });

    if (records_data.length === 0) {
      return res
        .status(404)
        .json({ message: "No records found for this teacher." });
    }

    return res.json({ data: records_data });
  } catch (error) {
    console.error("Error fetching records:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add a new teacher
teacherRouter.post("/", async (req: any, res: any) => {
  const { email, name, phone, gender, password } = req.body;

  if (!name || !phone || !gender) {
    return res.status(400).json({
      message: "name, gender and phone are required.",
    });
  }

  try {
    const data = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        role: "Teacher",
        gender,
        password,
      },
    });
    return res.status(201).json({ status: "Teacher added successfully", data });
  } catch (error) {
    console.error("Error adding teacher:", error);
    return res.status(500).json({ message: `Internal Server Error ${error}` });
  }
});

// Update a teacher
teacherRouter.put("/:id", async (req: any, res: any) => {
  const id = parseInt(req.params.id, 10); // Ensure id is an integer
  const { email, name, phone, gender, password } = req.body;
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid teacher ID" });
  }

  try {
    const updatedTeacher = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(name && { name }),
        ...(phone && { phone }),
        ...(gender && { gender }),
        ...(password && { password }),
      },
    });

    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    return res.json({
      status: "Teacher updated successfully",
      data: updatedTeacher,
    });
  } catch (error) {
    console.error("Error updating teacher:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = { teacherRouter };
