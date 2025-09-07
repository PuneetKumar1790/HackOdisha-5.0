import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit"; // <--- added

import authRoutes from "./routes/auth.js";
import streamRoutes from "./routes/stream.js";
import refreshRoutes from "./routes/refresh.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------- RATE LIMITERS --------------------

// Global limiter (light) → allows normal streaming traffic
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute per IP (enough for .ts chunks)
  message: { error: "Too many requests, slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // only 10 attempts per 15 min
  message: { error: "Too many authentication attempts, try again later." },
});
app.use("/api/auth", authLimiter);
app.use("/api/refresh", authLimiter);

// Super strict for SAS key / sensitive stream endpoints
const sasLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2, // only 2 key requests per minute
  message: { error: "Too many key requests." },
});
// apply ONLY if you have a route like /api/stream/key
app.use("/api/stream/key", sasLimiter);

// -------------------------------------------------------

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:5501",
  "http://localhost:5501",
  "http://127.0.0.1:5000",
  "http://localhost:5000",
  "https://hack-odisha-5-0.vercel.app",
  "https://hackodisha-5-0.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    exposedHeaders: ["set-cookie"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.set("trust proxy", 1);

const frontendDir = path.resolve(__dirname, "../Frontend");
app.use(express.static(frontendDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/refresh", refreshRoutes);
app.use("/api/stream", streamRoutes);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Error:", err);
  }
};

await connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
