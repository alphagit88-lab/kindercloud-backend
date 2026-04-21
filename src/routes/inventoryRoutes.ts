import { Router } from "express";
import { InventoryController } from "../controllers/InventoryController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// All routes are strictly for Admins based on the current requirements
router.use(authenticate, authorize("admin"));

// Stock operations
router.get("/stocks", InventoryController.getStocks);
router.post("/stocks", InventoryController.addStockItem);
router.put("/stocks/:id", InventoryController.updateStockItem);

// Asset operations
router.get("/assets", InventoryController.getAssets);
router.post("/assets", InventoryController.addAsset);
router.put("/assets/:id", InventoryController.updateAsset);

export default router;
