import { Express } from "express";
import { googleAuth, googleCallback, login, register } from "../controllers/authController";

export function registerAuthRoutes(app: Express): void {
  app.post("/auth/register", register);
  app.post("/auth/login", login);
  app.get("/auth/google", googleAuth);
  app.get("/auth/google/callback", googleCallback);
}
