import { Express } from "express";
import { createStaffAttendance, getStaffAttendance } from "../controllers/staffAttendanceController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

export function registerStaffAttendanceRoutes(app: Express): void {
  app.post("/staff-attendance", authenticate, authorize(["admin", "teacher"]), createStaffAttendance);
  app.get("/staff-attendance", authenticate, authorize(["admin", "teacher"]), getStaffAttendance);
}
