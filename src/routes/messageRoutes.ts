import { Router } from "express";
import { MessageController } from "../controllers/MessageController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticate);

router.post("/", MessageController.sendMessage);
router.get("/list", MessageController.getConversations);
router.get("/recipients", MessageController.getRecipients);
router.get("/:otherUserId", MessageController.getConversation);

export default router;
