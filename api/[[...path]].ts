import app from "../src/index";
import { AppDataSource } from "../src/config/data-source";

// Vercel serverless catch-all for forwarding requests to the Express app.
export default async function handler(req: any, res: any) {
  // Ensure database is initialized before handling request
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log("✓ Database initialized successfully for Vercel request");
    } catch (error: any) {
      console.error("✗ Database initialization failed for Vercel request:", error);
      return res.status(500).json({ 
        error: "Database connection failed", 
        message: error.message || "Unknown error during initialization" 
      });
    }
  }
  
  return app(req, res);
}

