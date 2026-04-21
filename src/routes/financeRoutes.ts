import { Router } from "express";
import { FinanceController } from "../controllers/FinanceController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// Retrieve all transactions (Admin and potentially Parent for their own, but US-A3 focuses on Admin)
router.get("/", authenticate, authorize("admin"), FinanceController.getTransactions);

// Admin-only operations
router.post("/", authenticate, authorize("admin"), FinanceController.addTransaction);

export default router;
