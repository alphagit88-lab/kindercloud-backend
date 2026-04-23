import { Router } from "express";
import { TeacherController } from "../controllers/TeacherController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

import { TeacherOperationsController } from "../controllers/TeacherOperationsController";

router.get("/", authenticate, authorize("admin"), TeacherController.getAll);
router.post("/", authenticate, authorize("admin"), TeacherController.create);
router.delete("/:id", authenticate, authorize("admin"), TeacherController.delete);

// Operations (Admin)
router.get("/attendance/all", authenticate, authorize("admin"), TeacherOperationsController.getAllAttendance);
router.post("/attendance", authenticate, authorize("admin"), TeacherOperationsController.markAttendance);
router.post("/salary", authenticate, authorize("admin"), TeacherOperationsController.processSalary);

// Operations (Shared/Self)
router.get("/attendance/:teacherId", authenticate, authorize("admin", "teacher"), TeacherOperationsController.getAttendance);
router.post("/attendance/mark", authenticate, authorize("teacher"), TeacherOperationsController.markAttendance);
router.post("/attendance/checkout", authenticate, authorize("teacher"), TeacherOperationsController.checkOut);
router.get("/salary/:teacherId", authenticate, authorize("admin", "teacher"), TeacherOperationsController.getSalaryHistory);

export default router;
