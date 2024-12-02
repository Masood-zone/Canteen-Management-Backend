import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const classController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const classes = await prisma.class.findMany();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: "Error fetching classes" });
    }
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const class_ = await prisma.class.findUnique({
        where: { id: parseInt(id) },
        include: { supervisor: true, students: true },
      });
      if (class_) {
        res.json(class_);
      } else {
        res.status(404).json({ error: "Class not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error fetching class" });
    }
  },

  create: async (req: Request, res: Response) => {
    const { name, description, supervisorId } = req.body;
    try {
      const newClass = await prisma.class.create({
        data: {
          name,
          description,
          supervisorId: supervisorId ? parseInt(supervisorId) : undefined,
        },
      });
      res.status(201).json(newClass);
    } catch (error) {
      res.status(400).json({ error: "Error creating class" });
    }
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, supervisorId } = req.body;
    try {
      const updatedClass = await prisma.class.update({
        where: { id: parseInt(id) },
        data: {
          name,
          description,
          supervisorId: supervisorId ? parseInt(supervisorId) : undefined,
        },
      });
      res.json(updatedClass);
    } catch (error) {
      res.status(400).json({ error: "Error updating class" });
    }
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await prisma.class.delete({
        where: { id: parseInt(id) },
      });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Error deleting class" });
    }
  },

  assignTeacher: async (req: Request, res: Response) => {
    const { name } = req.params;
    const { teacher_email } = req.body;

    if (!name || !teacher_email) {
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
        where: { name },
        data: {
          supervisorId: teacher.id,
        },
      });

      return res
        .status(200)
        .json({ message: "Teacher assigned successfully", updatedClass });
    } catch (error) {
      console.error("Error assigning teacher:", error);
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  },

  getClassBySupervisorId: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const class_ = await prisma.class.findFirst({
        where: { supervisorId: parseInt(id) },
      });
      res.json({ supervisor: class_ });
    } catch (error) {
      res.status(500).json({ error: "Error fetching class by supervisor" });
    }
  },
};
