import { Express } from "express";
import {
  createAttendance,
  getAttendance,
  getAttendanceByStudent,
} from "../controllers/attendanceController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

export function registerAttendanceRoutes(app: Express): void {
  app.post("/attendance", authenticate, authorize(["admin", "teacher"]), createAttendance);
  app.get("/attendance", authenticate, getAttendance);
  app.get("/attendance/student/:studentId", authenticate, getAttendanceByStudent);
}
