import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const generateRecordsForNewStudent = async (studentId: number) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });

    if (!student || !student.class) {
      console.error(
        `Student with id ${studentId} not found or not assigned to a class`
      );
      return;
    }

    const settings = await prisma.settings.findFirst({
      where: { name: "amount" },
    });

    const settingsAmount = settings ? parseInt(settings.value) : 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.record.create({
      data: {
        classId: student.class.id,
        payedBy: student.id,
        submitedAt: today,
        amount: 0,
        hasPaid: false,
        isPrepaid: false,
        isAbsent: false,
        settingsAmount,
        submitedBy: student.class.supervisorId || student.class.id,
      },
    });

    console.log(`Record generated for new student ${studentId}`);
  } catch (error) {
    if ((error as Prisma.PrismaClientKnownRequestError).code !== "P2002") {
      console.error(
        `Error generating record for new student ${studentId}:`,
        error
      );
    }
  }
};
