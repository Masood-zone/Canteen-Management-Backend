import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createUserInterface } from "../src/types/user.interface";

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
    where: { role: { in: ["Teacher", "TEACHER"] } },
  });
  return data;
}

export async function submitPrepaid(
  set_amount: number,
  amount: number,
  payedBy: number,
  submitedBy: number
) {
  // Validate inputs
  if (set_amount <= 0 || amount <= 0) {
    throw new Error("Amounts must be greater than 0");
  }

  // Calculate how many records to create
  const numberOfRecords = Math.floor(set_amount / amount);

  // Get the current date
  const currentDate = new Date();

  const records = [];

  // Create records sequentially with incrementing dates
  for (let i = 0; i < numberOfRecords; i++) {
    const submissionDate = new Date(currentDate);
    submissionDate.setDate(currentDate.getDate() + i); // Increment date by i days

    // Create a record in the database
    const record = await prisma.record.create({
      data: {
        amount: amount,
        submitedBy: submitedBy,
        payedBy: payedBy,
        submitedAt: submissionDate, // Use incremented date
        isPrepaid: true,
      },
    });

    records.push(record); // Store the created record in the array
  }

  return records; // Return all created records
}

export async function createAmount(amount: number) {
  const amount_update = await prisma.settings.create({
    data: {
      value: amount.toString(),
      name: "amount",
    },
  });
  return amount_update;
}

export async function updateAmount(amount: string) {
  try {
    const amount_update = await prisma.settings.update({
      where: {
        id: 1,
      },
      data: {
        value: amount.toString(),
      },
    });
    return amount_update;
  } catch (error) {
    console.error("Error updating amount:", error);
    throw new Error("Failed to update amount setting");
  }
}

export async function getAmount() {
  try {
    const amountUpdate = await prisma.settings.findUnique({
      where: {
        id: 1,
        name: "amount",
      },
    });

    // Check if the record was found
    if (!amountUpdate) {
      throw new Error("Amount setting not found");
    }

    return amountUpdate; // Return the found record
  } catch (error) {
    console.error("Error fetching amount:", error);
    throw new Error("Failed to retrieve amount setting"); // Re-throw with a more user-friendly message
  }
}

export async function getClassBySupervisorId(id: number) {
  try {
    const data = await prisma.class.findUnique({
      where: {
        id: id,
      },
    });

    const supervisor = await prisma.user.findUnique({
      select: {
        id: true,
        email: true,
        name: true,
        password: false,
      },
      where: {
        id: data?.id,
      },
    });

    return supervisor;
  } catch (error) {
    throw new Error("Faild to retrieve data");
  }
}

export async function createUser(data: createUserInterface) {
  try {
    const result_data = await prisma.user.create({
      data: data,
    });
    return result_data;
  } catch (error) {}
}

export async function createClass(data: createUserInterface) {
  try {
    const result_data = await prisma.user.create({
      data: data,
    });
    return result_data;
  } catch (error) {}
}
