import { updateUser } from "../../services/prisma.queries";
const express = require("express");

const userRouter = express.Router();

userRouter.put("/update", async (req: any, res: any) => {
  try {
    const { id, userData } = req.body;

    const result = await updateUser(id, userData);

    return res.status(200).json({
      message: "User updated successfully",
      user: result,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default userRouter;
