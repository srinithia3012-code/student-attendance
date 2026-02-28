import { Express } from "express";

export function registerRootRoutes(app: Express): void {
  app.get("/", (req, res) => {
    res.send("Backend is running");
  });
}
