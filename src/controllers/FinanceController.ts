import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Finance } from "../entities/Finance";

export class FinanceController {
  /**
   * Add a new financial transaction (Admin only) - US-A3
   */
  static async addTransaction(req: Request, res: Response) {
    try {
      const { type, amount, description, transactionDate } = req.body;

      if (!type || !["income", "expense"].includes(type)) {
        return res.status(400).json({ error: "Type must be either 'income' or 'expense'" });
      }

      if (amount === undefined || amount < 0) {
        return res.status(400).json({ error: "A valid positive amount is required" });
      }

      if (!description || !transactionDate) {
        return res.status(400).json({ error: "description and transactionDate are required" });
      }

      const repo = AppDataSource.getRepository(Finance);
      const transaction = repo.create({
        type,
        amount,
        description,
        transactionDate,
      });

      await repo.save(transaction);
      res.status(201).json({ message: "Transaction added successfully", transaction });
    } catch (error) {
      console.error("Add transaction error:", error);
      res.status(500).json({ error: "Failed to add financial transaction" });
    }
  }

  /**
   * Get all transactions (Admin only)
   */
  static async getTransactions(req: Request, res: Response) {
    try {
      const { type } = req.query;
      const repo = AppDataSource.getRepository(Finance);
      
      const filter: any = {};
      if (type && typeof type === "string" && ["income", "expense"].includes(type)) {
        filter.type = type;
      }

      const transactions = await repo.find({
        where: filter,
        order: { transactionDate: "DESC" },
      });

      // Quick summary calculation for reports
      let totalIncome = 0;
      let totalExpense = 0;

      transactions.forEach(t => {
        if (t.type === "income") totalIncome += Number(t.amount);
        if (t.type === "expense") totalExpense += Number(t.amount);
      });

      res.json({
        summary: {
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense
        },
        transactions
      });
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Failed to fetch financial transactions" });
    }
  }
}
