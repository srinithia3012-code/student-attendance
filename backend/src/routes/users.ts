import { Express } from "express";
import {
  createUser,
  deleteUser,
  getMe,
  getUserById,
  getUsers,
  updateMe,
  updateUser,
} from "../controllers/userController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

export function registerUserRoutes(app: Express): void {
  app.get("/me", authenticate, getMe);
  app.put("/users/me", authenticate, updateMe);
  app.post("/users", authenticate, authorize(["admin"]), createUser);
  app.get("/users", authenticate, authorize(["admin", "teacher", "student"]), getUsers);
  app.get("/users/:id", authenticate, authorize(["admin", "teacher"]), getUserById);
  app.put("/users/:id", authenticate, authorize(["admin"]), updateUser);
  app.delete("/users/:id", authenticate, authorize(["admin"]), deleteUser);
}
