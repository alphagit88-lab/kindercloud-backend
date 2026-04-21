import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Diary } from "../entities/Diary";

export class DiaryController {
  /**
   * Submit a new Diary Plan (Teacher only) - US-T1
   */
  static async submitDiary(req: Request, res: Response) {
    try {
      const { type, planDetails } = req.body;
      const teacherId = req.session.userId;

      if (!type || !["year", "month", "day"].includes(type)) {
        return res.status(400).json({ error: "Invalid or missing plan type. Must be 'year', 'month', or 'day'." });
      }

      if (!planDetails) {
        return res.status(400).json({ error: "Plan details are required." });
      }

      if (!teacherId) {
        return res.status(401).json({ error: "Unauthorized. Missing teacher identity." });
      }

      const repo = AppDataSource.getRepository(Diary);
      const diary = repo.create({
        teacherId,
        type,
        planDetails,
      });

      await repo.save(diary);
      res.status(201).json({ message: "Diary plan submitted successfully", diary });
    } catch (error) {
      console.error("Submit diary error:", error);
      res.status(500).json({ error: "Failed to submit diary plan" });
    }
  }

  /**
   * Get diaries for a specific teacher (Admin or the Teacher themselves)
   */
  static async getTeacherDiaries(req: Request, res: Response) {
    try {
      const { teacherId } = req.params;
      const requestingUserId = req.session.userId;
      const role = req.session.userRole;

      // Ensure that only the admin or the requesting teacher can view these logs
      if (role !== "admin" && requestingUserId !== teacherId) {
        return res.status(403).json({ error: "Access denied. Cannot view another teacher's diary." });
      }

      const repo = AppDataSource.getRepository(Diary);
      const diaries = await repo.find({
        where: { teacherId: teacherId as string },
        order: { createdAt: "DESC" },
      });

      res.json(diaries);
    } catch (error) {
      console.error("Get teacher diaries error:", error);
      res.status(500).json({ error: "Failed to fetch teacher diaries" });
    }
  }

  /**
   * Get all diaries (Admin only) - for curriculum review
   */
  static async getAllDiaries(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Diary);
      const diaries = await repo.find({
        relations: ["teacher"],
        order: { createdAt: "DESC" },
      });

      res.json(diaries);
    } catch (error) {
      console.error("Get all diaries error:", error);
      res.status(500).json({ error: "Failed to fetch diaries" });
    }
  }

  /**
   * Update an existing diary plan (Teacher only)
   */
  static async updateDiary(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { planDetails } = req.body;
      const teacherId = req.session.userId;
      const role = req.session.userRole;

      const repo = AppDataSource.getRepository(Diary);
      const diary = await repo.findOne({ where: { id: id as string } });

      if (!diary) {
        return res.status(404).json({ error: "Diary not found" });
      }

      if (diary.teacherId !== teacherId && role !== "admin") {
        return res.status(403).json({ error: "Access denied. Only the author can update this diary." });
      }

      if (planDetails) {
        diary.planDetails = planDetails;
      }

      await repo.save(diary);
      res.json({ message: "Diary updated successfully", diary });
    } catch (error) {
      console.error("Update diary error:", error);
      res.status(500).json({ error: "Failed to update diary" });
    }
  }
}
