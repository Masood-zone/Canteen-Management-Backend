import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export default async function handler(req, res) {
  // Verify the request using CRON_SECRET
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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

    let createdRecords = 0;
    let skippedRecords = 0;

    for (const classItem of classes) {
      for (const student of classItem.students) {
        try {
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
              submitedBy: classItem.supervisorId || classItem.id,
            },
          });
          createdRecords++;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            skippedRecords++;
          } else {
            throw error;
          }
        }
      }
    }

    console.log(
      `Daily record creation job completed successfully. Created: ${createdRecords}, Skipped: ${skippedRecords}`
    );

    return res.status(200).json({
      message: "Daily record creation job completed successfully",
      created: createdRecords,
      skipped: skippedRecords,
    });
  } catch (error) {
    console.error("Error in daily record creation job:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
