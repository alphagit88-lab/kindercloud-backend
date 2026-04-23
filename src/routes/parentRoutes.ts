import { Router } from "express";
import { ParentController } from "../controllers/ParentController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticate);
router.use(authorize("parent", "admin"));

router.get("/children", ParentController.getChildren);
router.get("/child/:kidId/lessons", ParentController.getChildLessons);
router.get("/payments", ParentController.getPayments);

export default router;
