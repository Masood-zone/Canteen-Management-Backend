import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const userController = {
  signup: async (req: Request, res: Response) => {
    const { email, password, role, name, phone, gender } = req.body;

    if (!email || !password || !role || !name || !phone || !gender) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          name,
          phone,
          gender,
        },
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        message: "User created successfully",
        data: userWithoutPassword,
      });
    } catch (error) {
      res.status(400).json({ error: "User already exists or invalid data" });
    }
  },

  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "User not found!" });
    }

    if (!user.password) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.TOKEN_SECRET as string,
      { expiresIn: "2d" }
    );

    const assignedClass = await prisma.class.findFirst({
      where: { supervisorId: user.id },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      token,
      user: userWithoutPassword,
      assigned_class: assignedClass,
    });
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          gender: true,
          assigned_class: true,
        },
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Error fetching users" });
    }
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          gender: true,
          assigned_class: true,
        },
      });
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error fetching user" });
    }
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, name, phone, role, gender } = req.body;
    try {
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { email, name, phone, role, gender },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          gender: true,
          assigned_class: true,
        },
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: "Error updating user" });
    }
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await prisma.user.delete({
        where: { id: parseInt(id) },
      });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Error deleting user" });
    }
  },
};
