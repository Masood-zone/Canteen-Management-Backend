const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

export async function getAllTeachers() {
  const data = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      role: true,
      email: true,
      phone: true,
      gender: true,
      assigned_class: true,
    },
    where: { role: "Teacher" },
  });
  return data;
}
