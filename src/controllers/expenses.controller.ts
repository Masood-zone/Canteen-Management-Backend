import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const expensesController = {
  createExpense: async (req: Request, res: Response) => {
    try {
      const { references, amount, date, description, submittedBy } = req.body;
      const amountData = parseFloat(amount);
      const expense = await prisma.expense.create({
        data: {
          amount: amountData,
          date: date ? new Date(date) : new Date(),
          description,
          submitedBy: submittedBy,
          reference: {
            connect: {
              id: references?.id,
            },
          },
        },
        include: {
          reference: true,
        },
      });

      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: `Internal Server Error ${error}` });
    }
  },
  createReference: async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;

      const reference = await prisma.reference.create({
        data: {
          name,
          description,
        },
      });

      res.status(201).json(reference);
    } catch (error) {
      console.error("Error creating reference:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  getAllReferences: async (req: Request, res: Response) => {
    try {
      const references = await prisma.reference.findMany();

      res.status(200).json(references);
    } catch (error) {
      console.error("Error fetching references:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getAllExpenses: async (req: Request, res: Response) => {
    try {
      const expenses = await prisma.expense.findMany({
        include: {
          reference: true,
        },
        orderBy: {
          date: "desc",
        },
      });

      res.status(200).json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  getExpenseById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const expense = await prisma.expense.findUnique({
        where: {
          id: parseInt(id),
        },
        include: {
          reference: true,
        },
      });

      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.status(200).json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  getReferenceById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const reference = await prisma.reference.findUnique({
        where: {
          id: parseInt(id),
        },
      });

      if (!reference) {
        return res.status(404).json({ message: "Reference not found" });
      }

      res.status(200).json(reference);
    } catch (error) {
      console.error("Error fetching reference:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  updateExpense: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { references, amount, date, description, submittedBy } = req.body;
      const amountData = parseFloat(amount);
      const expense = await prisma.expense.update({
        where: {
          id: parseInt(id),
        },
        data: {
          amount: amountData,
          date: date ? new Date(date) : new Date(),
          description,
          submitedBy: submittedBy,
          reference: {
            connect: {
              id: references?.id,
            },
          },
        },
        include: {
          reference: true,
        },
      });

      res.status(200).json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  updateReference: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const reference = await prisma.reference.update({
        where: {
          id: parseInt(id),
        },
        data: {
          name,
          description,
        },
      });

      res.status(200).json(reference);
    } catch (error) {
      console.error("Error updating reference:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  deleteExpense: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.expense.delete({
        where: {
          id: parseInt(id),
        },
      });

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  deleteReference: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.reference.delete({
        where: {
          id: parseInt(id),
        },
      });

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting reference:", error);
      res.status(500).json({ message: `Internal Server Error ${error}` });
    }
  },
};
