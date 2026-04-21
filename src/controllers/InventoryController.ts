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
      const { quantity } = req.body;

      const repo = AppDataSource.getRepository(Stock);
      const stock = await repo.findOne({ where: { id: id as string } });

      if (!stock) {
        return res.status(404).json({ error: "Stock item not found" });
      }

      stock.quantity = quantity;
      await repo.save(stock);

      res.json({ message: "Stock updated successfully", stock });
    } catch (error) {
      console.error("Update stock error:", error);
      res.status(500).json({ error: "Failed to update stock" });
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
      const { condition } = req.body;

      const repo = AppDataSource.getRepository(Asset);
      const asset = await repo.findOne({ where: { id: id as string } });

      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }

      if (condition) asset.condition = condition;
      await repo.save(asset);

      res.json({ message: "Asset updated successfully", asset });
    } catch (error) {
      console.error("Update asset error:", error);
      res.status(500).json({ error: "Failed to update asset" });
    }
  }
}
