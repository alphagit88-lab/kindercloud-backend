import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { GuardianLink } from "../entities/GuardianLink";
import { Lesson } from "../entities/Lesson";
import { Finance } from "../entities/Finance";
import { User } from "../entities/User";
import { In } from "typeorm";

export class ParentController {
  
  static async getChildren(req: Request, res: Response) {
    try {
      const parentId = req.session.userId;
      if (!parentId) return res.status(401).json({ error: "Unauthorized" });

      const linkRepo = AppDataSource.getRepository(GuardianLink);
      const links = await linkRepo.find({
        where: { parentId },
        relations: ["kid"]
      });

      const children = links.map(link => link.kid);
      res.json(children);
    } catch (error) {
      console.error("Get children error:", error);
      res.status(500).json({ error: "Failed to fetch children" });
    }
  }

  static async getChildActivity(req: Request, res: Response) {
    try {
      const { kidId } = req.params;
      const parentId = req.session.userId;
      if (!parentId) return res.status(401).json({ error: "Unauthorized" });

      // Verify parent is linked to this kid
      const linkRepo = AppDataSource.getRepository(GuardianLink);
      const link = await linkRepo.findOne({ where: { parentId, kidId } });
      if (!link && req.session.userRole !== 'admin') {
        return res.status(403).json({ error: "Access denied. Not your child." });
      }

      const lessonRepo = AppDataSource.getRepository(Lesson);
      const lessons = await lessonRepo.find({
        where: { teacher: { students: { userId: kidId } } as any }, // This is a bit complex due to relations
        // Simpler way: filter by classroom of the student
        order: { lessonDate: "DESC" },
        relations: ["teacher"]
      });

      // Let's refine the query to be more direct if possible
      // Find the classroom the student belongs to
      const studentRepo = AppDataSource.getTreeRepository(User); // Assuming student data is elsewhere
      // Actually, we have the Lesson entity with classRoomId. 
      // We should probably find the student's classroom first.

      res.json(lessons);
    } catch (error) {
      console.error("Get child activity error:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  }

  // Improved version using classroom
  static async getChildLessons(req: Request, res: Response) {
    try {
        const { kidId } = req.params;
        const parentId = req.session.userId;
        if (!parentId) return res.status(401).json({ error: "Unauthorized" });

        const linkRepo = AppDataSource.getRepository(GuardianLink);
        const link = await linkRepo.findOne({ where: { parentId, kidId } });
        if (!link && req.session.userRole !== 'admin') {
            return res.status(403).json({ error: "Access denied. Not your child." });
        }

        // Get student's classroom
        const studentRepo = AppDataSource.getRepository(require("../entities/Student").Student);
        const student = await studentRepo.findOne({ where: { userId: kidId } });
        
        if (!student || !student.classRoomId) {
            return res.json([]); // No classroom assigned yet
        }

        const lessonRepo = AppDataSource.getRepository(Lesson);
        const lessons = await lessonRepo.find({
            where: { classRoomId: student.classRoomId },
            order: { lessonDate: "DESC" },
            relations: ["teacher"]
        });

        res.json(lessons);
    } catch (error) {
        console.error("Get child lessons error:", error);
        res.status(500).json({ error: "Failed to fetch lessons" });
    }
  }

  static async getPayments(req: Request, res: Response) {
    try {
      const parentId = req.session.userId;
      if (!parentId) return res.status(401).json({ error: "Unauthorized" });

      const linkRepo = AppDataSource.getRepository(GuardianLink);
      const links = await linkRepo.find({ where: { parentId } });
      const kidIds = links.map(l => l.kidId);

      if (kidIds.length === 0) return res.json([]);

      const financeRepo = AppDataSource.getRepository(Finance);
      const payments = await financeRepo.find({
        where: { studentId: In(kidIds) },
        order: { transactionDate: "DESC" }
      });

      res.json(payments);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  }
}
