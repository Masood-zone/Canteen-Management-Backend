import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const recordController = {
  getRecordsByClass: async (classId: number, date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const studentsInClass = await prisma.student.findMany({
      // where: { classId: classId },
    });

    const existingRecords = await prisma.record.findMany({
      where: {
        classId,
        submitedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { student: true },
    });

    const recordMap = new Map(
      existingRecords.map((record) => [record.payedBy, record])
    );

    const allRecords = await Promise.all(
      studentsInClass.map(async (student) => {
        const existingRecord = recordMap.get(student.id);
        if (existingRecord) {
          return existingRecord;
        } else {
          return prisma.record.create({
            data: {
              classId,
              payedBy: student.id,
              submitedAt: startOfDay,
              amount: 0,
              hasPaid: false,
              isPrepaid: false,
              submitedBy: 0,
            },
            include: { student: true },
          });
        }
      })
    );

    const unpaidStudents = allRecords.filter((record) => !record.hasPaid);
    const paidStudents = allRecords.filter((record) => record.hasPaid);

    return { unpaidStudents, paidStudents };
  },

  getByClassAndDate: async (req: Request, res: Response) => {
    const classId = parseInt(req.params.classId);
    const date = new Date(req.query.date as string);

    if (isNaN(classId) || isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid classId or date" });
    }

    try {
      const records = await recordController.getRecordsByClass(classId, date);
      res.status(200).json(records);
    } catch (error) {
      console.error("Error fetching records:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  submitStudentRecord: async (req: Request, res: Response) => {
    const { amount, submitedBy, payedBy, isPrepaid, hasPaid, classId } =
      req.body;
    try {
      const record = await prisma.record.create({
        data: {
          amount: parseInt(amount),
          submitedBy: parseInt(submitedBy),
          payedBy: payedBy ? parseInt(payedBy) : undefined,
          isPrepaid: Boolean(isPrepaid),
          hasPaid: Boolean(hasPaid),
          classId: parseInt(classId),
        },
      });
      res.status(201).json(record);
    } catch (error) {
      console.error("Error submitting student record:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, submitedBy, payedBy, isPrepaid, hasPaid, classId } =
      req.body;
    try {
      const updatedRecord = await prisma.record.update({
        where: { id: parseInt(id) },
        data: {
          amount: parseInt(amount),
          submitedBy: parseInt(submitedBy),
          payedBy: payedBy ? parseInt(payedBy) : undefined,
          isPrepaid: Boolean(isPrepaid),
          hasPaid: Boolean(hasPaid),
          classId: parseInt(classId),
        },
      });
      res.json(updatedRecord);
    } catch (error) {
      res.status(400).json({ error: "Error updating record" });
    }
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await prisma.record.delete({
        where: { id: parseInt(id) },
      });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Error deleting record" });
    }
  },
};
