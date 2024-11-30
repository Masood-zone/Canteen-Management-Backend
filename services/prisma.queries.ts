import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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

export const updateUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { name, email, phone, gender } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { name, email, phone, gender },
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "User update failed" });
  }
};
