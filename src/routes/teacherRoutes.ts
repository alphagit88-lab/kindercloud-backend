import { Router } from "express";
import { TeacherController } from "../controllers/TeacherController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, authorize("admin"), TeacherController.getAll);
router.post("/", authenticate, authorize("admin"), TeacherController.create);
router.delete("/:id", authenticate, authorize("admin"), TeacherController.delete);

export default router;
