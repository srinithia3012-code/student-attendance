import { Express } from "express";
import {
  createUser,
  deleteUser,
  getMe,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/userController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

export function registerUserRoutes(app: Express): void {
  app.get("/me", authenticate, getMe);
  app.post("/users", authenticate, authorize(["admin"]), createUser);
  app.get("/users", authenticate, authorize(["admin", "teacher"]), getUsers);
  app.get("/users/:id", authenticate, authorize(["admin", "teacher"]), getUserById);
  app.put("/users/:id", authenticate, authorize(["admin"]), updateUser);
  app.delete("/users/:id", authenticate, authorize(["admin"]), deleteUser);
}
