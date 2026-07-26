import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import helmet from "helmet";

import dotenv from "dotenv";
dotenv.config();


import gameRoute from "./routes/routes.js";
import errorHandler from "./middleware/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Serve static files from backend public/upload folder with CORS enabled for cross-origin frontend requests
app.use("/upload", cors(), express.static(path.join(__dirname, "..", "public", "upload")));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://panel.allyonogamesstore.com",
      "https://allyonogamesstore.com/"
    ],
    credentials: true,
    exposedHeaders: ["set-cookie"],
  })
);

app.use(helmet());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500,
});

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
  });
});

app.use("/api", limiter, speedLimiter, gameRoute);

// ⚠️ Global error handler — MUST be registered last
app.use(errorHandler);

export default app;