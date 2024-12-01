import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const studentController = {
  // GetAll
  getAll: async (req: Request, res: Response) => {
    try {
      const students = await prisma.student.findMany();
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Error fetching students" });
    }
  },
  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const student = await prisma.student.findUnique({
        where: { id: parseInt(id) },
      });
      if (student) {
        res.json(student);
      } else {
        res.status(404).json({ error: "Student not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error fetching student" });
    }
  },

  getByClassId: async (req: Request, res: Response) => {
    const { className } = req.params;
    try {
      const students = await prisma.student.findMany({
        where: { className: className },
        // include: { class: true },
      });
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Error fetching students" });
    }
  },

  create: async (req: Request, res: Response) => {
    const { name, age, parentPhone, gender, className } = req.body;

    // Check if className exists
    const classExists = await prisma.class.findUnique({
      where: { name: className },
    });
    if (!classExists) {
      return res.status(400).json({ error: "Class does not exist" });
    }

    try {
      const newStudent = await prisma.student.create({
        data: {
          name,
          age: parseInt(age),
          parentPhone,
          className,
          gender,
        },
      });
      res.status(201).json(newStudent);
    } catch (error) {
      res.status(400).json({ error: `Error creating student ${error}` });
    }
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, age, parentPhone, gender } = req.body;
    try {
      const updatedStudent = await prisma.student.update({
        where: { id: parseInt(id) },
        data: {
          name,
          age: parseInt(age),
          parentPhone,
          gender,
        },
      });
      res.json(updatedStudent);
    } catch (error) {
      res.status(400).json({ error: "Error updating student" });
    }
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await prisma.student.delete({
        where: { id: parseInt(id) },
      });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Error deleting student" });
    }
  },
};
