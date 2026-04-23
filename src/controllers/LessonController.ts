import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Lesson } from "../entities/Lesson";
import { FileStorageService } from "../services/FileStorageService";

export class LessonController {
  /**
   * Log a new Lesson (Teacher only) - US-T2
   */
  static async logLesson(req: Request, res: Response) {
    try {
      const { classRoomId, subject, lessonDate, plan, activity, progress, homework, assessment, attachmentType } = req.body;
      const teacherId = req.session.userId;
      const file = req.file;

      if (!classRoomId || !subject || !lessonDate) {
        return res.status(400).json({ error: "classRoomId, subject, and lessonDate are required" });
      }

      if (!teacherId) {
        return res.status(401).json({ error: "Unauthorized. Missing teacher identity." });
      }

      let attachmentUrl = undefined;
      if (file) {
          const storage = FileStorageService.getInstance();
          const uploadResult = await storage.saveFile(
              file as any,
              attachmentType || "document",
              teacherId
          );
          attachmentUrl = uploadResult.fileUrl;
      }

      const repo = AppDataSource.getRepository(Lesson);
      const lesson = repo.create({
        classRoomId,
        teacherId,
        subject,
        lessonDate,
        plan,
        activity,
        progress,
        homework,
        assessment,
        attachmentUrl,
        attachmentType: attachmentType || (file ? "document" : undefined)
      });

      await repo.save(lesson);
      res.status(201).json({ message: "Lesson logged successfully", lesson });
    } catch (error) {
      console.error("LOG LESSON ERROR FULL:", error);
      res.status(500).json({ error: "Failed to log lesson. " + (error instanceof Error ? error.message : "Internal Server Error") });
    }
  }

  /**
   * Get all lessons for a specific classroom
   */
  static async getClassRoomLessons(req: Request, res: Response) {
    try {
      const { classRoomId } = req.params;
      const repo = AppDataSource.getRepository(Lesson);
      const lessons = await repo.find({
        where: { classRoomId: classRoomId as string },
        order: { lessonDate: "DESC" },
        relations: ["teacher"]
      });

      res.json(lessons);
    } catch (error) {
      console.error("Get lessons error:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  }

  /**
   * Update an existing lesson log (Teacher only)
   */
  static async updateLesson(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { plan, activity, progress, homework, assessment } = req.body;
      const teacherId = req.session.userId;

      const repo = AppDataSource.getRepository(Lesson);
      const lesson = await repo.findOne({ where: { id: id as string } });

      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      // Ensure that only the teacher who created it, or admin can update
      // Taking a simple safeguard check
      if (lesson.teacherId !== teacherId && req.session.userRole !== 'admin') {
         return res.status(403).json({ error: "Access denied. Only the assigned teacher can edit this lesson." });
      }

      if (plan) lesson.plan = plan;
      if (activity) lesson.activity = activity;
      if (progress) lesson.progress = progress;
      if (homework) lesson.homework = homework;
      if (assessment) lesson.assessment = assessment;

      await repo.save(lesson);
      res.json({ message: "Lesson updated successfully", lesson });
    } catch (error) {
      console.error("Update lesson error:", error);
      res.status(500).json({ error: "Failed to update lesson" });
    }
  }
}
