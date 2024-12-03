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

  getTeachersWithRecordsSummary: async (req: Request, res: Response) => {
    const { from, to } = req.query;

    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "Start and end dates are required" });
    }

    const startDate = new Date(from as string);
    const endDate = new Date(to as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    try {
      const teacherRecords = await prisma.user.findMany({
        where: {
          role: { in: ["TEACHER", "Teacher"] },
        },
        select: {
          id: true,
          name: true,
          Record: {
            where: {
              submitedAt: {
                gte: startDate,
                lte: endDate,
              },
            },
            select: {
              amount: true,
            },
          },
        },
      });
      //Check for empty records
      if (teacherRecords.length === 0) {
        return res
          .status(404)
          .json({ message: "No records found for this teacher." });
      }

      // Format the records to include the total amount
      const formattedRecords = teacherRecords.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        totalAmount: teacher.Record.reduce(
          (sum, record) => sum + record.amount,
          0
        ),
      }));

      res.status(200).json(formattedRecords);
    } catch (error) {
      console.error("Error fetching teacher records summary:", error);
      res.status(500).json({ message: `Internal Server Error ${error}` });
    }
  },

  getTeacherRecordsDetail: async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "Start and end dates are required" });
    }

    const startDate = new Date(from as string);
    const endDate = new Date(to as string);

    try {
      const teacherRecords = await prisma.record.findMany({
        where: {
          submitedBy: parseInt(teacherId),
          submitedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          student: true,
          class: true,
        },
        orderBy: {
          submitedAt: "asc",
        },
      });

      res.status(200).json(teacherRecords);
    } catch (error) {
      console.error("Error fetching teacher records detail:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getTeachersById: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ message: "Invalid teacher ID, This does not help!" });
    }

    try {
      const teacher = await prisma.user.findUnique({
        where: { id: id },
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          phone: true,
          gender: true,
          assigned_class: true,
        },
      });
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.status(200).json({ teacher });
    } catch (error) {
      console.error("Error fetching teacher:", error);
      res.status(500).json({ message: `Internal Server Error ${error}` });
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
