import { Express } from "express";
import {
  createStudent,
  deleteStudent,
  getStudentById,
  getStudents,
  updateStudent,
} from "../controllers/studentController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

export function registerStudentRoutes(app: Express): void {
  app.post("/students", authenticate, authorize(["admin", "teacher"]), createStudent);
  app.get("/students", authenticate, getStudents);
  app.get("/students/:id", authenticate, getStudentById);
  app.put("/students/:id", authenticate, authorize(["admin", "teacher"]), updateStudent);
  app.delete("/students/:id", authenticate, authorize(["admin", "teacher"]), deleteStudent);
}
