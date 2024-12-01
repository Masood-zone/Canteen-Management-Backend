import express from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const classRouter = express.Router();

classRouter.get("/", async (req: any, res: any) => {
  try {
    const allClasses = await prisma.class.findMany();
    return res.json({ all: allClasses });
  } catch (error) {
    return res.json({ error: "class not found" }).status(400);
  }
});

classRouter.post("/", async (req: any, res: any) => {
  const { name, description, supervisorId } = req.body;

  try {
    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        supervisorId,
      },
    });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ error: "Error creating class" });
  }
});

classRouter.get("/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const classById = await prisma.class.findUnique({
      where: {
        id: parseInt(id),
      },
      // select: {
      //   students: true,
      // },
    });
    res.json(classById);
  } catch (error) {
    res.status(400).json({ error: "Class not found" });
  }
});

classRouter.put("/:id", async (req: any, res: any) => {
  const { id } = req.params;
  const { name, description, supervisorId } = req.body;

  try {
    const updatedClass = await prisma.class.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name,
        description,
        supervisorId,
      },
    });
    res.json(updatedClass);
  } catch (error) {
    res.status(400).json({ error: "Error updating class" });
  }
});

module.exports = { classRouter };
