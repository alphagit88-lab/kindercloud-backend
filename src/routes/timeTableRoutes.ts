import { Router } from "express";
import { TimeTableController } from "../controllers/TimeTableController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// Viewable by authenticated users (teachers/admins)
router.get("/:classRoomId", authenticate, TimeTableController.getByClass);

// Admin only management
router.post("/", authenticate, authorize("admin"), TimeTableController.addEntry);
router.delete("/:id", authenticate, authorize("admin"), TimeTableController.deleteEntry);

export default router;
