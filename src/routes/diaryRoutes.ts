import { Router } from "express";
import { DiaryController } from "../controllers/DiaryController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// Admin curriculum review
router.get("/", authenticate, authorize("admin"), DiaryController.getAllDiaries);

// Teacher logging routes
router.post("/", authenticate, authorize("teacher"), DiaryController.submitDiary);
router.put("/:id", authenticate, authorize("teacher", "admin"), DiaryController.updateDiary);

// Get specific teacher diaries
router.get("/teacher/:teacherId", authenticate, authorize("admin", "teacher"), DiaryController.getTeacherDiaries);

export default router;
