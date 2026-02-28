import { Express } from "express";
import {
  createAttendanceSession,
  getAttendanceSessions,
} from "../controllers/attendanceSessionController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

export function registerAttendanceSessionRoutes(app: Express): void {
  app.post("/attendance-sessions", authenticate, authorize(["admin", "teacher"]), createAttendanceSession);
  app.get("/attendance-sessions", authenticate, getAttendanceSessions);
}
