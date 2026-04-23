import { Router } from "express";
import { KinderWorkController } from "../controllers/KinderWorkController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticate);
router.use(authorize("kid", "admin", "parent")); // Parents can also see their kid's work

router.get("/works", KinderWorkController.getWorks);
router.get("/works/:type", KinderWorkController.getWorksByType);

export default router;
