import { Router } from "express";
import { LessonController } from "../controllers/LessonController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB
});

// Retrieve lessons by classroom
router.get("/classroom/:classRoomId", authenticate, authorize("admin", "teacher", "parent", "kid"), LessonController.getClassRoomLessons);

// Teacher actions to log lessons
router.post("/", authenticate, authorize("teacher"), upload.single('file'), LessonController.logLesson);
router.put("/:id", authenticate, authorize("teacher", "admin"), LessonController.updateLesson);

export default router;
