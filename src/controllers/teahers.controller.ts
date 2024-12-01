import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const teacherController = {
  getAllTeachers: async (req: Request, res: Response) => {
    try {
      const teachers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          phone: true,
          gender: true,
          assigned_class: true,
        },
        where: { role: { in: ["Teacher", "TEACHER"] } },
      });
      res.status(200).json({ teachers });
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getTeacherById: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }
    try {
      const teacher = await prisma.user.findUnique({
        where: { id },
        include: { assigned_class: true },
      });
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json({ data: teacher });
    } catch (error) {
      console.error("Error fetching teacher:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getTeacherRecords: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }
    try {
      const records = await prisma.record.findMany({
        where: { submitedBy: id },
      });
      if (records.length === 0) {
        return res
          .status(404)
          .json({ message: "No records found for this teacher." });
      }
      res.json({ data: records });
    } catch (error) {
      console.error("Error fetching records:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  createTeacher: async (req: Request, res: Response) => {
    const { email, name, phone, gender, password } = req.body;
    if (!name || !phone || !gender) {
      return res.status(400).json({
        message: "name, gender and phone are required.",
      });
    }
    try {
      const newTeacher = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          role: "TEACHER",
          gender,
          password,
        },
      });
      res
        .status(201)
        .json({ status: "Teacher added successfully", data: newTeacher });
    } catch (error) {
      console.error("Error adding teacher:", error);
      res.status(500).json({ message: `Internal Server Error ${error}` });
    }
  },

  updateTeacher: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { email, name, phone, gender, password, assigned_class } = req.body;
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
          ...(assigned_class && {
            assigned_class: {
              connect: { id: assigned_class.id },
            },
          }),
        },
      });
      if (!updatedTeacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json({
        status: "Teacher updated successfully",
        data: updatedTeacher,
      });
    } catch (error) {
      console.error("Error updating teacher:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  deleteTeacher: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }
    try {
      const deletedTeacher = await prisma.user.delete({
        where: { id },
      });
      if (!deletedTeacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json({
        status: "Teacher deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  submitPrepaid: async (req: Request, res: Response) => {
    const { set_amount, amount, payedBy, submitedBy, classId } = req.body;
    if (set_amount <= 0 || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Amounts must be greater than 0" });
    }
    try {
      const numberOfRecords = Math.floor(set_amount / amount);
      const currentDate = new Date();
      const records = [];

      for (let i = 0; i < numberOfRecords; i++) {
        const submissionDate = new Date(currentDate);
        submissionDate.setDate(currentDate.getDate() + i);

        const record = await prisma.record.create({
          data: {
            amount: amount,
            submitedBy: submitedBy,
            payedBy: payedBy,
            submitedAt: submissionDate,
            isPrepaid: true,
            hasPaid: true,
            classId: classId,
          },
        });
        records.push(record);
      }
      res.status(201).json({
        status: "Prepaid records created successfully",
        data: records,
      });
    } catch (error) {
      console.error("Error submitting prepaid records:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getClassBySupervisorId: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid supervisor ID" });
    }
    try {
      const classData = await prisma.class.findUnique({
        where: { id },
        select: {
          // students: true,
          records: true,
          supervisorId: true,
          supervisor: true,
        },
      });
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      const supervisor = await prisma.user.findUnique({
        where: { id: classData.supervisorId ?? undefined },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
      res.json({ supervisor });
    } catch (error) {
      console.error("Error fetching class by supervisor:", error);
      res.status(500).json({ message: "Failed to retrieve data" });
    }
  },
};

export default teacherController;
