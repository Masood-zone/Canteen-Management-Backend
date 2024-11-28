const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const studentRouter = express.Router();

studentRouter.get("/", async (req: any, res: any) => {
  try {
    const result = await prisma.students.findMany()
    return res.status(200).json({ teachers: result });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

studentRouter.post("/", async (req: any, res: any) => {
  const { name, age, phone } = req.body;
  try {
    const data = await prisma.students.create({
      data: {
        name,
        age,
        phone,
        
      },
    });
    return res
      .status(200)
      .json({ status: "user added successfully", data: data });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = { studentRouter };
