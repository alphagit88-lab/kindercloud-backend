import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Stock } from "../entities/Stock";
import { Asset } from "../entities/Asset";

export class InventoryController {
  // --- STOCK MANAGEMENT ---

  static async addStockItem(req: Request, res: Response) {
    try {
      const { itemName, quantity } = req.body;
      if (!itemName || quantity === undefined) {
        return res.status(400).json({ error: "itemName and quantity are required" });
      }

      const repo = AppDataSource.getRepository(Stock);
      const stock = repo.create({ itemName, quantity });

      await repo.save(stock);
      res.status(201).json({ message: "Stock item added successfully", stock });
    } catch (error) {
      console.error("Add stock error:", error);
      res.status(500).json({ error: "Failed to add stock item" });
    }
  }

  static async getStocks(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Stock);
      const stocks = await repo.find();
      res.json(stocks);
    } catch (error) {
      console.error("Get stocks error:", error);
      res.status(500).json({ error: "Failed to fetch stocks" });
    }
  }

  static async updateStockItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { itemName, quantity } = req.body;
      
      console.log(`[InventoryController] UPDATE stock request: ID=${id}, body=${JSON.stringify(req.body)}`);

      const repo = AppDataSource.getRepository(Stock);
      const stock = await repo.findOne({ where: { id: id as string } });

      if (!stock) {
        console.warn(`[InventoryController] Stock item ${id} not found.`);
        return res.status(404).json({ error: "Stock item not found" });
      }

      // Explicitly update properties if they exist in body
      if (itemName !== undefined) stock.itemName = itemName;
      if (quantity !== undefined) stock.quantity = Number(quantity);
      
      console.log(`[InventoryController] Entity before save: ${JSON.stringify(stock)}`);
      
      const savedStock = await repo.save(stock);
      
      console.log(`[InventoryController] Entity after save: ${JSON.stringify(savedStock)}`);

      res.json({ 
        message: "Stock updated successfully", 
        stock: savedStock,
        debug: {
          receivedBody: req.body,
          updatedItemName: stock.itemName,
          updatedQuantity: stock.quantity
        }
      });
    } catch (error: any) {
      console.error("Update stock error:", error);
      res.status(500).json({ error: "Failed to update stock", details: error.message });
    }
  }

  static async deleteStockItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const repo = AppDataSource.getRepository(Stock);
      const result = await repo.delete(id);

      if (result.affected === 0) {
        return res.status(404).json({ error: "Stock item not found" });
      }

      res.json({ message: "Stock item deleted successfully" });
    } catch (error) {
      console.error("Delete stock error:", error);
      res.status(500).json({ error: "Failed to delete stock item" });
    }
  }

  // --- ASSET MANAGEMENT ---

  static async addAsset(req: Request, res: Response) {
    try {
      const { itemName, condition } = req.body;
      if (!itemName) {
        return res.status(400).json({ error: "itemName is required" });
      }

      const repo = AppDataSource.getRepository(Asset);
      const asset = repo.create({
        itemName,
        condition: condition || "good"
      });

      await repo.save(asset);
      res.status(201).json({ message: "Asset added successfully", asset });
    } catch (error) {
      console.error("Add asset error:", error);
      res.status(500).json({ error: "Failed to add asset" });
    }
  }

  static async getAssets(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Asset);
      const assets = await repo.find();
      res.json(assets);
    } catch (error) {
      console.error("Get assets error:", error);
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  }

  static async updateAsset(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { itemName, condition } = req.body;

      const repo = AppDataSource.getRepository(Asset);
      const asset = await repo.findOne({ where: { id: id as string } });

      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }

      if (itemName) asset.itemName = itemName;
      if (condition) asset.condition = condition;

      await repo.save(asset);

      res.json({ message: "Asset updated successfully", asset });
    } catch (error) {
      console.error("Update asset error:", error);
      res.status(500).json({ error: "Failed to update asset" });
    }
  }

  static async deleteAsset(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`[InventoryController] DELETE request received for Asset ID: "${id}"`);

      const repo = AppDataSource.getRepository(Asset);

      // Check if asset exists first
      const asset = await repo.findOne({ where: { id: id as string } });

      if (!asset) {
        const allAssets = await repo.find();
        console.warn(`[InventoryController] Asset with ID "${id}" NOT FOUND in DB.`);
        return res.status(404).json({
          error: "Asset not found",
          message: `No asset exists with the ID: ${id}. Available IDs: ${allAssets.map(a => a.id).join(', ')}`
        });
      }

      await repo.remove(asset);
      console.log(`[InventoryController] Asset "${id}" deleted successfully`);

      res.json({ message: "Asset deleted successfully" });
    } catch (error: any) {
      console.error("Delete asset error:", error);
      res.status(500).json({
        error: "Failed to delete asset",
        message: error.message || "An unexpected error occurred"
      });
    }
  }
}
