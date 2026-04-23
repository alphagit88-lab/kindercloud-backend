import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { KinderWork } from "../entities/KinderWork";

export class KinderWorkController {
  
  static async getWorks(req: Request, res: Response) {
    try {
      const kidId = req.session.userId;
      if (!kidId) return res.status(401).json({ error: "Unauthorized" });

      const workRepo = AppDataSource.getRepository(KinderWork);
      const works = await workRepo.find({
        where: { kidId: kidId as string },
        order: { createdAt: "DESC" }
      });

      res.json(works);
    } catch (error) {
      console.error("Get works error:", error);
      res.status(500).json({ error: "Failed to fetch works" });
    }
  }

  static async getWorksByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const kidId = req.session.userId;
      if (!kidId) return res.status(401).json({ error: "Unauthorized" });

      const workRepo = AppDataSource.getRepository(KinderWork);
      const works = await workRepo.find({
        where: { kidId: kidId as string, fileType: type as string },
        order: { createdAt: "DESC" }
      });

      res.json(works);
    } catch (error) {
      console.error("Get works by type error:", error);
      res.status(500).json({ error: "Failed to fetch works" });
    }
  }
}
