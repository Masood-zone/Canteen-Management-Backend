import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const recordController = {
  getRecordsByClass: async (classId: number, date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const studentsInClass = await prisma.student.findMany({
        where: { classId },
      });

      const settings = await prisma.settings.findFirst({
        where: { name: "amount" },
      });

      const settingsAmount = settings ? parseInt(settings.value) : 0;

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
            return prisma.record.update({
              where: { id: existingRecord.id },
              data: { hasPaid: false },
              include: { student: true },
            });
          } else {
            try {
              return await prisma.record.create({
                data: {
                  classId,
                  payedBy: student.id,
                  submitedAt: startOfDay,
                  amount: 0,
                  hasPaid: false,
                  isPrepaid: false,
                  isAbsent: false,
                  settingsAmount,
                  submitedBy: classId, // Assuming the class ID can be used as a placeholder for the teacher
                },
                include: { student: true },
              });
            } catch (error) {
              if (error instanceof Prisma.PrismaClientKnownRequestError) {
                console.error(
                  `Failed to create record for student ${student.id}:`,
                  error
                );
                return null;
              }
              throw error;
            }
          }
        })
      );

      const validRecords = allRecords.filter(
        (record): record is NonNullable<typeof record> => record !== null
      );
      const unpaidStudents = validRecords.filter((record) => !record.hasPaid);
      const paidStudents = validRecords.filter((record) => record.hasPaid);

      return { unpaidStudents, paidStudents };
    } catch (error) {
      console.error("Error in getRecordsByClass:", error);
      throw error;
    }
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
    const {
      amount,
      submitedBy,
      payedBy,
      isPrepaid,
      hasPaid,
      classId,
      isAbsent,
    } = req.body;

    try {
      const settings = await prisma.settings.findFirst({
        where: { name: "amount" },
      });

      const settingsAmount = settings ? parseInt(settings.value) : 0;

      const record = await prisma.record.create({
        data: {
          amount: parseInt(amount),
          submitedBy: parseInt(submitedBy),
          payedBy: payedBy ? parseInt(payedBy) : undefined,
          isPrepaid: Boolean(isPrepaid),
          hasPaid: Boolean(hasPaid),
          classId: parseInt(classId),
          isAbsent: Boolean(isAbsent),
          settingsAmount,
        },
      });
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003") {
          res.status(400).json({
            error:
              "Invalid foreign key. Please check submitedBy, payedBy, and classId values.",
          });
        } else {
          res.status(400).json({ error: "Error creating record" });
        }
      } else {
        console.error("Error submitting student record:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      amount,
      submitedBy,
      payedBy,
      isPrepaid,
      hasPaid,
      classId,
      isAbsent,
    } = req.body;
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
          isAbsent: Boolean(isAbsent),
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
