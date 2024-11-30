import { authenticateToken } from "..";

const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const userRouter = express.Router();

// Get all users
userRouter.get("/", authenticateToken, async (req: any, res: any) => {
  try {
    const result = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        password: true, // Don't return password - test
        phone: true,
        role: true,
        assigned_class: true,
      },
    });
    return res.status(200).json({ users: result });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update a user
userRouter.put("/update/:id", authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { name, email, phone, gender } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, email, phone, gender },
    });
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({
      message: "User updated successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ error: `User update failed ${error}` });
  }
});

// Delete a user
userRouter.delete("/:id", authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: `User deletion failed ${error}` });
  }
});

export default userRouter;
