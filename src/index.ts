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
  userController.signup(req, res).catch(next);
});
app.post("/login", (req, res, next) => {
  userController.login(req, res).catch(next);
});
app.get("/users", authenticateToken, userController.getAll);
app.get("/users/:id", authenticateToken, userController.getById);
app.put("/users/:id", authenticateToken, userController.update);
app.delete("/users/:id", authenticateToken, userController.delete);

// Class routes
app.get("/classes", authenticateToken, classController.getAll);
app.get("/classes/:id", authenticateToken, classController.getById);
app.post("/classes", authenticateToken, classController.create);
app.put("/classes/:id", authenticateToken, classController.update);
app.delete("/classes/:id", authenticateToken, classController.delete);
app.put("/classes/:name/assign", authenticateToken, (req, res, next) => {
  classController.assignTeacher(req, res).catch(next);
});
app.get(
  "/classes/:id/supervisor",
  authenticateToken,
  classController.getClassBySupervisorId
);

// Student routes
app.get("/students", authenticateToken, studentController.getAll);
app.get("/students/:id", authenticateToken, studentController.getById);
app.get(
  "/students/class/:classId",
  authenticateToken,
  studentController.getByClassId
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
app.get("/records/:classId", authenticateToken, async (req, res, next) => {
  try {
    await recordController.getByClassAndDate(req, res);
  } catch (error) {
    next(error);
  }
});
app.post("/records", authenticateToken, recordController.submitStudentRecord);
app.put("/records/:id", authenticateToken, recordController.update);
app.delete("/records/:id", authenticateToken, recordController.delete);

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
app.post("/teachers/prepaid", authenticateToken, async (req, res, next) => {
  try {
    await teacherController.submitPrepaid(req, res);
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

const PORT = process.env.PORT || 3400;
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
