import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const settingsController = {
  getAmount: async (req: Request, res: Response) => {
    try {
      const setting = await prisma.settings.findFirst({
        where: { name: "amount" },
      });
      res.status(200).json({ data: setting });
    } catch (error) {
      console.error("Error fetching amount:", error);
      res.status(400).json({ error: "Error fetching amount" });
    }
  },

  createAmount: async (req: Request, res: Response) => {
    const { value } = req.body;
    const amount = parseFloat(value);

    if (isNaN(amount)) {
      return res
        .status(400)
        .json({ error: "Invalid amount: must be a number" });
    }

    try {
      const setting = await prisma.settings.create({
        data: {
          name: "amount",
          value: amount.toString(),
        },
      });
      res.status(200).json({ data: setting });
    } catch (error) {
      res.status(400).json({ error: "Error creating amount setting" });
    }
  },

  updateAmount: async (req: Request, res: Response) => {
    const { value } = req.body;
    const amount = parseFloat(value);
    if (isNaN(amount)) {
      return res
        .status(400)
        .json({ error: "Invalid amount: must be a number" });
    }

    try {
      const setting = await prisma.settings.updateMany({
        where: { name: "amount" },
        data: { value: amount.toString() },
      });
      res.status(200).json({ data: setting });
    } catch (error) {
      res.status(400).json({ error: "Error updating amount setting" });
    }
  },
};
