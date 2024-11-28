const express = require("express");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

dotenv.config();

const prisma = new PrismaClient();
const classRouter = express.Router();

classRouter.get("/", async (req: any, res: any) => {
  try {
    const allClasses = await prisma.classes.findMany();
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


module.exports  = {classRouter}