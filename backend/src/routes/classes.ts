import { Express } from "express";
import {
  createClass,
  deleteClass,
  getClassById,
  getClasses,
  updateClass,
} from "../controllers/classController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

export function registerClassRoutes(app: Express): void {
  app.post("/classes", authenticate, authorize(["admin"]), createClass);
  app.get("/classes", authenticate, getClasses);
  app.get("/classes/:id", authenticate, getClassById);
  app.put("/classes/:id", authenticate, authorize(["admin"]), updateClass);
  app.delete("/classes/:id", authenticate, authorize(["admin"]), deleteClass);
}
