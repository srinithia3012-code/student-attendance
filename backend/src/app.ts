import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { registerRoutes } from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { startStaffAutoAbsentService } from "./services/staffAutoAbsentService";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

registerRoutes(app);
startStaffAutoAbsentService();

// keep these last
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
