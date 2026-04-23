import "reflect-metadata";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import { AppDataSource } from "./config/data-source";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { sanitizeUserData } from "./middleware/authMiddleware";
import { sanitizeInput } from "./middleware/inputSanitizer";
import { apiRateLimiter } from "./middleware/rateLimiter";
import { handleSessionExpiration } from "./middleware/sessionMiddleware";
import { requestIdMiddleware } from "./middleware/requestId";
import path from "path";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app: Application = express();
app.set("trust proxy", 1);

// 1. CORS MUST BE FIRST to ensure every response has the correct headers
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "https://kindercloud-frontend.vercel.app"
    ].filter(Boolean) as string[];
    
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Cookie"]
}));

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// 2. Lazy DB init for serverless environments (e.g. Vercel)
let dbMigrated = false;
let isInitializing = false;
app.use(async (req: Request, res: Response, next) => {
  // CRITICAL: Preflight requests (OPTIONS) MUST skip the database connection
  // Otherwise, the browser hangs forever while the database tries to wake up.
  if (req.method === "OPTIONS") {
    return next();
  }

  if (!AppDataSource.isInitialized) {
    if (isInitializing) {
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 500));
            if (AppDataSource.isInitialized) break;
        }
    }

    if (!AppDataSource.isInitialized) {
        isInitializing = true;
        try {
          console.log("... Middleware connecting to database ...");
          await AppDataSource.initialize();
          console.log("✓ Middleware database connection successful");
        } catch (error: any) {
          console.error("✗ Middleware database connection failed:", error);
          isInitializing = false;
          return res.status(500).json({ 
            error: "Database connection failed", 
            message: error?.message || "Unknown error during initialization"
          });
        } finally {
          isInitializing = false;
        }
    }
  }

  if (!dbMigrated && AppDataSource.isInitialized) {
    dbMigrated = true;
    try {
      const cols = await AppDataSource.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'app_sessions' AND column_name = 'destroyedAt'`
      );
      if (cols.length === 0) {
        await AppDataSource.query(`ALTER TABLE "app_sessions" ADD COLUMN "destroyedAt" TIMESTAMP`);
      }
    } catch (e) {
      console.warn("Session table migration skipped or failed:", e);
    }
  }

  next();
});

import { getSessionStore } from "./config/session-store";

// Session configuration
const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
  resave: false,
  saveUninitialized: false,
  proxy: isProd,
  store: getSessionStore(),
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: parseInt(process.env.SESSION_MAX_AGE || "86400000"),
    path: '/',
  },
});

app.use((req: Request, res: Response, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  return sessionMiddleware(req, res, (err) => {
    if (err) {
      console.error("[Session Error]", err);
    } else {
      console.log(`[Session] Path: ${req.path}, ID: ${req.sessionID}, UserID: ${req.session?.userId || 'None'}`);
    }
    next(err);
  });
});

app.use(requestIdMiddleware);
app.use(sanitizeInput);
app.use(handleSessionExpiration);
app.use("/api", apiRateLimiter);

const isVercel = !!process.env.VERCEL;
const uploadDir = isVercel 
  ? "/tmp/uploads" 
  : (process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
app.use("/uploads", express.static(uploadDir));
app.use(sanitizeUserData);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "LMS Backend API is running" });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    secureCookie: (process.env.NODE_ENV === "production" || !!process.env.VERCEL)
  });
});

import classRoomRoutes from "./routes/classRoomRoutes";
import lessonRoutes from "./routes/lessonRoutes";
import diaryRoutes from "./routes/diaryRoutes";
import financeRoutes from "./routes/financeRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import studentRoutes from "./routes/studentRoutes";
import teacherRoutes from "./routes/teacherRoutes";
import eventRoutes from "./routes/eventRoutes";
import timeTableRoutes from "./routes/timeTableRoutes";
import messageRoutes from "./routes/messageRoutes";
import parentRoutes from "./routes/parentRoutes";
import kidRoutes from "./routes/kidRoutes";

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/classrooms", classRoomRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/timetable", timeTableRoutes);
app.use("/api/diaries", diaryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/kids", kidRoutes);
app.use("/api", userRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Global error:", err);
  if (err instanceof Error) {
    if (err.message.includes("Invalid file type")) return res.status(400).json({ error: err.message });
    if (err.message.includes("File too large")) return res.status(413).json({ error: "File too large. Max size is 500MB." });
  }
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File too large. Max size is 500MB." });
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message || "An unexpected error occurred"
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✓ Server is running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
    AppDataSource.initialize()
      .then(() => {
        console.log("✓ Database ready");
      })
      .catch((error) => {
        console.error("✗ Background database connection failed:", error);
      });
  });
}

export default app;
