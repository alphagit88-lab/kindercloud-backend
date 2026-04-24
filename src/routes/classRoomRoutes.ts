import { Router } from "express";
import { ClassRoomController } from "../controllers/ClassRoomController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use((req, res, next) => {
  console.log(`[ClassRoomRouter] ${req.method} ${req.path}`);
  next();
});

// Retrieve classrooms (Accessible by internal staff)
router.get("/", authenticate, authorize("admin", "teacher"), ClassRoomController.getAllClassRooms);
router.get("/:id", authenticate, authorize("admin", "teacher"), ClassRoomController.getClassRoomById);

// Admin only actions
router.post("/", authenticate, authorize("admin"), ClassRoomController.createClassRoom);
router.put("/:id", authenticate, authorize("admin"), ClassRoomController.updateClassRoom);
router.delete("/:id", authenticate, authorize("admin"), ClassRoomController.deleteClassRoom);
router.put("/:id/assign-teacher", authenticate, authorize("admin"), ClassRoomController.assignTeacher);

export default router;
