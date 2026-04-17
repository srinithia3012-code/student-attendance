import { Express } from "express";
import {
  createAttendanceSession,
  deleteAttendanceSession,
  getAttendanceSessions,
  updateAttendanceSession,
} from "../controllers/attendanceSessionController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

export function registerAttendanceSessionRoutes(app: Express): void {
  app.post("/attendance-sessions", authenticate, authorize(["admin", "teacher"]), createAttendanceSession);
  app.get("/attendance-sessions", authenticate, getAttendanceSessions);
  app.put("/attendance-sessions/:sessionId", authenticate, authorize(["admin", "teacher"]), updateAttendanceSession);
  app.delete("/attendance-sessions/:sessionId", authenticate, authorize(["admin", "teacher"]), deleteAttendanceSession);
}
