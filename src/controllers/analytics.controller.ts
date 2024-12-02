import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const analyticsController = {
  getTeacherAnalytics: async (req: Request, res: Response) => {
    const { classId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const [settingsAmount, totalStudents, paidStudents, unpaidStudents] =
        await Promise.all([
          prisma.settings.findFirst({
            where: { name: "amount" },
            select: { value: true },
          }),
          prisma.student.count({
            where: { classId: parseInt(classId) },
          }),
          prisma.record.count({
            where: {
              classId: parseInt(classId),
              submitedAt: { gte: today },
              hasPaid: true,
            },
          }),
          prisma.record.count({
            where: {
              classId: parseInt(classId),
              submitedAt: { gte: today },
              hasPaid: false,
            },
          }),
        ]);

      const amount = settingsAmount ? parseInt(settingsAmount.value) : 0;
      const totalAmount = totalStudents * amount;
      const paidAmount = paidStudents * amount;
      const unpaidAmount = unpaidStudents * amount;

      res.status(200).json({
        totalAmount,
        totalStudents,
        paidStudents: {
          count: paidStudents,
          amount: paidAmount,
        },
        unpaidStudents: {
          count: unpaidStudents,
          amount: unpaidAmount,
        },
      });
    } catch (error) {
      console.error("Error fetching teacher analytics:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};
