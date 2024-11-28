const express = require("express");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

dotenv.config();

const prisma = new PrismaClient();
const teacherRouter = express.Router();

teacherRouter.get("/", async (req:any, res:any) => {
  try {
    const result = await prisma.$queryRaw`SELECT id, email, name, phone, role FROM User WHERE role = 'Teacher';`;
    return res.status(200).json({ teachers: result });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


teacherRouter.post("/", async (req: any, res: any) => {
    const {email, name, phone}  = req.body
  try {
    const data = await prisma.user.create({data:{
      email,
      name,
      phone,
      role:"Teacher"
    }})
    return res.status(200).json({ 'status':'user added successfully', data:data });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});




module.exports = { teacherRouter };
