import { PrismaClient } from "@prisma/client";
import cron from "node-cron";

const prisma = new PrismaClient();

export const setupDailyRecordCreation = () => {
  // Schedule the job to run every day at 02:09 AM
  cron.schedule("30 00 * * *", async () => {
    console.log("Running daily record creation job");

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const classes = await prisma.class.findMany({
        include: { students: true },
      });

      const settings = await prisma.settings.findFirst({
        where: { name: "amount" },
      });

      const settingsAmount = settings ? parseInt(settings.value) : 0;

      for (const classItem of classes) {
        for (const student of classItem.students) {
          await prisma.record.create({
            data: {
              classId: classItem.id,
              payedBy: student.id,
              submitedAt: today,
              amount: 0,
              hasPaid: false,
              isPrepaid: false,
              isAbsent: false,
              settingsAmount,
              submitedBy: classItem.supervisorId || classItem.id, // Use supervisor ID if available, otherwise use class ID
            },
          });
        }
      }

      console.log("Daily record creation job completed successfully");
    } catch (error) {
      console.error("Error in daily record creation job:", error);
    }
  });
};
