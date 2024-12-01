import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getRecordsByClass = async (classId: number, date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const records = await prisma.record.findMany({
    where: {
      classId,
      submitedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      student: true,
    },
  });

  const unpaidStudents = records.filter((record) => !record.hasPaid);
  const paidStudents = records.filter((record) => record.hasPaid);

  return {
    unpaidStudents,
    paidStudents,
  };
};

export const submitStudentRecord = async (data: {
  amount: number;
  payedBy: number;
  hasPaid: boolean;
  submitedBy: number;
  classId: number;
}) => {
  const record = await prisma.record.create({
    data: {
      amount: data.amount,
      payedBy: data.payedBy,
      hasPaid: data.hasPaid,
      submitedBy: data.submitedBy,
      classId: data.classId,
    },
  });

  return record;
};

export const getPresetAmount = async () => {
  const setting = await prisma.settings.findFirst({
    where: { name: "amount" },
  });

  return setting ? parseInt(setting.value) : 0;
};
