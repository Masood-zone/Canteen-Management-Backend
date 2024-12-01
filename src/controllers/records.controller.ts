import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getRecordsByClass = async (classId: number, date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all students in the class
  const studentsInClass = await prisma.student.findMany({
    where: {
      classId: classId,
    },
  });

  // Fetch existing records for the specified date
  const existingRecords = await prisma.record.findMany({
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

  // Create a map of existing records by student ID
  const recordMap = new Map(
    existingRecords.map((record) => [record.payedBy, record])
  );

  // Create or fetch records for all students
  const allRecords = await Promise.all(
    studentsInClass.map(async (student) => {
      const existingRecord = recordMap.get(student.id);
      if (existingRecord) {
        return existingRecord;
      } else {
        // Create a new record for students without one
        return prisma.record.create({
          data: {
            classId,
            payedBy: student.id,
            submitedAt: startOfDay,
            amount: 0, // Set default amount or fetch from settings
            hasPaid: false,
            isPrepaid: false,
            submitedBy: 0, // Set a default or fetch the teacher ID
          },
          include: {
            student: true,
          },
        });
      }
    })
  );

  const unpaidStudents = allRecords.filter((record) => !record.hasPaid);
  const paidStudents = allRecords.filter((record) => record.hasPaid);

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
