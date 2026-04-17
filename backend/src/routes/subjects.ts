import { Express } from "express";
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject,
} from "../controllers/subjectController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

export function registerSubjectRoutes(app: Express): void {
  app.post("/subjects", authenticate, authorize(["admin", "teacher"]), createSubject);
  app.get("/subjects", authenticate, getSubjects);
  app.get("/subjects/:id", authenticate, getSubjectById);
  app.put("/subjects/:id", authenticate, authorize(["admin", "teacher"]), updateSubject);
  app.delete("/subjects/:id", authenticate, authorize(["admin", "teacher"]), deleteSubject);
}
