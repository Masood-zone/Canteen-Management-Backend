import express from "express";
// import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";

import { recordController } from "./controllers/records.controller";
import { classController } from "./controllers/class.controller";
import { userController } from "./controllers/users.controller";
import { studentController } from "./controllers/student.controller";
import { settingsController } from "./controllers/settings.controller";
import teacherController from "./controllers/teahers.controller";
import { setupDailyRecordCreation } from "../services/daily-records.cron";
import { analyticsController } from "./controllers/analytics.controller";

dotenv.config();

// const prisma = new PrismaClient();
const app = express();

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Authentication middleware
function authenticateToken(req: any, res: any, next: Function) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(
    token,
    process.env.TOKEN_SECRET as string,
    (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    }
  );
}

// User routes
app.post("/signup", (req, res, next) => {
  userController.signup(req, res).catch(next); //Works
});
app.post("/login", (req, res, next) => {
  userController.login(req, res).catch(next); //Works
});
app.get("/users", authenticateToken, userController.getAll); //works
app.get("/users/:id", authenticateToken, userController.getById); //works
app.put("/users/:id", authenticateToken, userController.update); //works
app.delete("/users/:id", authenticateToken, userController.delete); //works

// Class routes
app.get("/classes", authenticateToken, classController.getAll); //works
app.get("/classes/:id", authenticateToken, classController.getById); //works
app.post("/classes", authenticateToken, classController.create); //works
app.put("/classes/:id", authenticateToken, classController.update); //works
app.delete("/classes/:id", authenticateToken, classController.delete); //works
app.put("/classes/:name/assign", authenticateToken, (req, res, next) => {
  classController.assignTeacher(req, res).catch(next);
}); //Not used
app.get(
  "/classes/:id/supervisor",
  authenticateToken,
  classController.getClassBySupervisorId
); //works

// Student routes
app.get("/students", authenticateToken, studentController.getAll);
app.get("/students/:id", authenticateToken, studentController.getById);
app.get(
  "/students/class/:classId",
  authenticateToken,
  studentController.getClassById
);
app.post("/students", authenticateToken, async (req, res, next) => {
  try {
    await studentController.create(req, res);
  } catch (error) {
    next(error);
  }
});
app.put("/students/:id", authenticateToken, studentController.update);
app.delete("/students/:id", authenticateToken, studentController.delete);

// Record routes
app.post(
  "/records/generate-daily",
  authenticateToken,
  recordController.generateDailyRecords
);
app.get("/records/:classId", authenticateToken, async (req, res, next) => {
  try {
    await recordController.getByClassAndDate(req, res);
  } catch (error) {
    next(error);
  }
});
app.put("/records/:id", authenticateToken, recordController.update);
app.delete("/records/:id", authenticateToken, recordController.delete);
// Get unpaid students
app.get(
  "/records/:classId/unpaid",
  authenticateToken,
  async (req, res, next) => {
    try {
      await recordController.getUnpaidStudents(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Get paid students
app.get("/records/:classId/paid", authenticateToken, async (req, res, next) => {
  try {
    await recordController.getPaidStudents(req, res);
  } catch (error) {
    next(error);
  }
});

// Get absent students
app.get(
  "/records/:classId/absent",
  authenticateToken,
  async (req, res, next) => {
    try {
      await recordController.getAbsentStudents(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Update student status
app.put("/records/:id/status", authenticateToken, async (req, res, next) => {
  try {
    await recordController.updateStudentStatus(req, res);
  } catch (error) {
    next(error);
  }
});
// Settings routes
app.get("/settings/amount", authenticateToken, settingsController.getAmount);
app.post("/settings/amount", authenticateToken, (req, res, next) => {
  settingsController.createAmount(req, res).catch(next);
});
app.put("/settings/amount", authenticateToken, (req, res, next) => {
  settingsController.updateAmount(req, res).catch(next);
});

// Teacher routes
app.get("/teachers", authenticateToken, teacherController.getAllTeachers);
app.get("/teachers/:id", authenticateToken, (req, res, next) => {
  teacherController.getTeacherById(req, res).catch(next);
});
app.get("/teachers/:id/records", authenticateToken, async (req, res, next) => {
  try {
    await teacherController.getTeacherRecords(req, res);
  } catch (error) {
    next(error);
  }
});
app.post("/teachers", authenticateToken, async (req, res, next) => {
  try {
    await teacherController.createTeacher(req, res);
  } catch (error) {
    next(error);
  }
});
app.put("/teachers/:id", authenticateToken, (req, res, next) => {
  teacherController.updateTeacher(req, res).catch(next);
});
app.delete("/teachers/:id", authenticateToken, async (req, res, next) => {
  try {
    await teacherController.deleteTeacher(req, res);
  } catch (error) {
    next(error);
  }
});
app.get("/teachers/:id/class", authenticateToken, async (req, res, next) => {
  try {
    await teacherController.getClassBySupervisorId(req, res);
  } catch (error) {
    next(error);
  }
});

// Analytics routes
// Admin analytics
app.get(
  "/analytics/admin-dashboard",
  authenticateToken,
  async (req, res, next) => {
    try {
      await analyticsController.getAdminAnalytics(req, res);
    } catch (error) {
      next(error);
    }
  }
);
// Teachers analytics
app.get(
  "/analytics/teachers/:classId",
  authenticateToken,
  async (req, res, next) => {
    try {
      await analyticsController.getTeacherAnalytics(req, res);
    } catch (error) {
      next(error);
    }
  }
);

const PORT = process.env.PORT || 3400;
// Setup daily cron job
setupDailyRecordCreation();
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
