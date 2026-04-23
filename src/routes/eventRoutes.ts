import { Router } from "express";
import { EventController } from "../controllers/EventController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// Everyone authenticated can see events (limited by audience in frontend or filter here if needed)
router.get("/", authenticate, EventController.getAll);

// Admin only management
router.post("/", authenticate, authorize("admin"), EventController.create);
router.delete("/:id", authenticate, authorize("admin"), EventController.delete);

export default router;
