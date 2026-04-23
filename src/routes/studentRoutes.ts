import { Router } from "express";
import { StudentController } from "../controllers/StudentController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// Only admin can manage students
router.get("/", authenticate, authorize("admin"), StudentController.getAll);
router.post("/", authenticate, authorize("admin"), StudentController.create);
router.put("/:id", authenticate, authorize("admin"), StudentController.update);
router.delete("/:id", authenticate, authorize("admin"), StudentController.delete);

export default router;
