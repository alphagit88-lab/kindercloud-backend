import { Router } from "express";
import { LessonController } from "../controllers/LessonController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// Retrieve lessons by classroom
router.get("/classroom/:classRoomId", authenticate, authorize("admin", "teacher", "parent", "kid"), LessonController.getClassRoomLessons);

// Teacher actions to log lessons
router.post("/", authenticate, authorize("teacher"), LessonController.logLesson);
router.put("/:id", authenticate, authorize("teacher", "admin"), LessonController.updateLesson);

export default router;
