import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const recordController = {
  // Generate daily records for each student in a class
  generateDailyRecords: async (req: Request, res: Response) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    try {
      // Get all classes
      const classes = await prisma.class.findMany({
        include: { students: true },
      });

      // Get the settings amount
      const settings = await prisma.settings.findFirst({
        where: { name: "amount" },
      });
      const settingsAmount = settings ? parseInt(settings.value) : 0;

      // Generate records for each student in each class
      for (const classItem of classes) {
        for (const student of classItem.students) {
          try {
            await prisma.record.create({
              data: {
                classId: classItem.id,
                payedBy: student.id,
                submitedAt: date,
                amount: 0,
                hasPaid: false,
                isPrepaid: false,
                isAbsent: false,
                settingsAmount,
                submitedBy: classItem.supervisorId || 0, // Assuming 0 is a valid placeholder if no supervisor
              },
            });
          } catch (error) {
            // If a record already exists for this student on this day, skip it
            if (
              (error as Prisma.PrismaClientKnownRequestError).code === "P2002"
            ) {
              console.log(
                `Record already exists for student ${
                  student.id
                } on ${date.toISOString()}`
              );
            } else {
              throw error;
            }
          }
        }
      }

      res.status(200).json({ message: "Daily records generated successfully" });
    } catch (error) {
      console.error("Error generating daily records:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

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
          let record = recordMap.get(student.id);
          if (!record) {
            try {
              record = await prisma.record.create({
                data: {
                  classId,
                  payedBy: student.id,
                  submitedAt: startOfDay,
                  amount: 0,
                  hasPaid: false,
                  isPrepaid: false,
                  isAbsent: false,
                  settingsAmount,
                  submitedBy: classId,
                },
                include: { student: true },
              });
            } catch (error) {
              if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
              ) {
                // If the record already exists (due to unique constraint violation), fetch it
                const foundRecord = await prisma.record.findFirst({
                  where: {
                    classId,
                    settingsAmount,
                    payedBy: student.id,
                    submitedAt: {
                      gte: startOfDay,
                      lte: endOfDay,
                    },
                  },
                  include: { student: true },
                });
                record = foundRecord || undefined;
              } else {
                console.error(
                  `Failed to create/fetch record for student ${student.id}:`,
                  error
                );
                return null;
              }
            }
          }
          return record;
        })
      );

      const validRecords = allRecords.filter(
        (record): record is NonNullable<typeof record> => record !== null
      );
      const unpaidStudents = validRecords.filter(
        (record) => !record.hasPaid && !record.isAbsent
      );
      const paidStudents = validRecords.filter((record) => record.hasPaid);
      const absentStudents = validRecords.filter((record) => record.isAbsent);

      return { unpaidStudents, paidStudents, absentStudents };
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
  updateStudentStatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { hasPaid, isAbsent } = req.body;

    if (typeof hasPaid !== "boolean" || typeof isAbsent !== "boolean") {
      return res.status(400).json({ error: "Invalid input data" });
    }

    try {
      const updatedRecord = await prisma.record.update({
        where: { id: parseInt(id) },
        data: {
          hasPaid,
          isAbsent,
        },
        include: { student: true },
      });

      res.status(200).json(updatedRecord);
    } catch (error) {
      console.error("Error updating student status:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          res.status(404).json({ error: "Record not found" });
        } else {
          res.status(400).json({ error: "Error updating record" });
        }
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  },

  submitTeacherRecord: async (req: Request, res: Response) => {
    const { classId, date, records } = req.body;

    if (!classId || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    const settings = await prisma.settings.findFirst({
      where: { name: "amount" },
    });

    const settingsAmount = settings ? parseInt(settings.value) : 0;

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }

    try {
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingRecords = await prisma.record.findMany({
        where: {
          classId,
          submitedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const recordMap = new Map(
        existingRecords.map((record) => [record.payedBy, record])
      );

      const updatedRecords = await Promise.all(
        records.map(async (record) => {
          const { payedBy, amount, hasPaid, isPrepaid, isAbsent } = record;
          const existingRecord = recordMap.get(payedBy);

          if (existingRecord) {
            return prisma.record.update({
              where: { id: existingRecord.id },
              data: {
                amount: parseInt(amount),
                hasPaid: Boolean(hasPaid),
                isPrepaid: Boolean(isPrepaid),
                isAbsent: Boolean(isAbsent),
              },
            });
          } else {
            try {
              return await prisma.record.create({
                data: {
                  classId: parseInt(classId),
                  payedBy: parseInt(payedBy),
                  submitedAt: startOfDay,
                  amount: parseInt(amount),
                  hasPaid: Boolean(hasPaid),
                  isPrepaid: Boolean(isPrepaid),
                  isAbsent: Boolean(isAbsent),
                  submitedBy: parseInt(classId),
                  settingsAmount,
                },
              });
            } catch (error) {
              if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
              ) {
                // If the record already exists, fetch and update it
                const existingRecord = await prisma.record.findFirst({
                  where: {
                    classId: parseInt(classId),
                    payedBy: parseInt(payedBy),
                    submitedAt: {
                      gte: startOfDay,
                      lte: endOfDay,
                    },
                  },
                });
                if (existingRecord) {
                  return prisma.record.update({
                    where: { id: existingRecord.id },
                    data: {
                      amount: parseInt(amount),
                      hasPaid: Boolean(hasPaid),
                      isPrepaid: Boolean(isPrepaid),
                      isAbsent: Boolean(isAbsent),
                    },
                  });
                }
              }
              throw error;
            }
          }
        })
      );

      res.status(201).json(updatedRecords);
    } catch (error) {
      console.error("Error submitting teacher record:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getUnpaidStudents: async (req: Request, res: Response) => {
    const classId = parseInt(req.params.classId);
    const date = new Date(req.query.date as string);

    if (isNaN(classId) || isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid classId or date" });
    }

    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const unpaidStudents = await prisma.record.findMany({
        where: {
          classId,
          submitedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          hasPaid: false,
          isAbsent: false,
        },
        include: { student: true },
      });

      res.status(200).json(unpaidStudents);
    } catch (error) {
      console.error("Error fetching unpaid students:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getPaidStudents: async (req: Request, res: Response) => {
    const classId = parseInt(req.params.classId);
    const date = new Date(req.query.date as string);

    if (isNaN(classId) || isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid classId or date" });
    }

    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const paidStudents = await prisma.record.findMany({
        where: {
          classId,
          submitedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          hasPaid: true,
        },
        include: { student: true },
      });

      res.status(200).json(paidStudents);
    } catch (error) {
      console.error("Error fetching paid students:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getAbsentStudents: async (req: Request, res: Response) => {
    const classId = parseInt(req.params.classId);
    const date = new Date(req.query.date as string);

    if (isNaN(classId) || isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid classId or date" });
    }

    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const absentStudents = await prisma.record.findMany({
        where: {
          classId,
          submitedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          isAbsent: true,
        },
        include: { student: true },
      });

      res.status(200).json(absentStudents);
    } catch (error) {
      console.error("Error fetching absent students:", error);
      res.status(500).json({ error: "Internal Server Error" });
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
