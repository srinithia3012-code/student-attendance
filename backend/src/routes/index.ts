import { Express } from "express";
import { registerAttendanceRoutes } from "./attendance";
import { registerAttendanceSessionRoutes } from "./attendanceSessions";
import { registerAuthRoutes } from "./auth";
import { registerClassRoutes } from "./classes";
import { registerRootRoutes } from "./root";
import { registerStaffAttendanceRoutes } from "./staffAttendance";
import { registerStudentRoutes } from "./students";
import { registerSubjectRoutes } from "./subjects";
import { registerUserRoutes } from "./users";

export function registerRoutes(app: Express): void {
  registerRootRoutes(app);
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerClassRoutes(app);
  registerStudentRoutes(app);
  registerSubjectRoutes(app);
  registerAttendanceSessionRoutes(app);
  registerAttendanceRoutes(app);
  registerStaffAttendanceRoutes(app);
}
