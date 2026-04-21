import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { ClassRoom } from "../entities/ClassRoom";

export class ClassRoomController {
  /**
   * Create a new ClassRoom (Admin only)
   */
  static async createClassRoom(req: Request, res: Response) {
    try {
      const { name, teacherId } = req.body;
      if (!name) {
        return res.status(400).json({ error: "ClassRoom name is required" });
      }

      const repo = AppDataSource.getRepository(ClassRoom);
      const classRoom = repo.create({
        name,
        teacherId: teacherId || null,
      });

      await repo.save(classRoom);
      res.status(201).json({ message: "ClassRoom created successfully", classRoom });
    } catch (error) {
      console.error("Create classroom error:", error);
      res.status(500).json({ error: "Failed to create classroom" });
    }
  }

  /**
   * Get all ClassRooms
   */
  static async getAllClassRooms(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(ClassRoom);
      const classrooms = await repo.find({
        relations: ["teacher"],
      });
      res.json(classrooms);
    } catch (error) {
      console.error("Get classrooms error:", error);
      res.status(500).json({ error: "Failed to fetch classrooms" });
    }
  }

  /**
   * Get a single ClassRoom by ID
   */
    static async getClassRoomById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const repo = AppDataSource.getRepository(ClassRoom);
      const classRoom = await repo.findOne({
        where: { id: id as string },
        relations: ["teacher"],
      });

      if (!classRoom) {
        return res.status(404).json({ error: "ClassRoom not found" });
      }

      res.json(classRoom);
    } catch (error) {
      console.error("Get classroom error:", error);
      res.status(500).json({ error: "Failed to fetch classroom" });
    }
  }

  /**
   * Assign a teacher to a ClassRoom (Admin only) - US-A4
   */
  static async assignTeacher(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { teacherId } = req.body;

      const repo = AppDataSource.getRepository(ClassRoom);
      const classRoom = await repo.findOne({ where: { id: id as string } });

      if (!classRoom) {
        return res.status(404).json({ error: "ClassRoom not found" });
      }

      classRoom.teacherId = teacherId;
      await repo.save(classRoom);

      res.json({ message: "Teacher assigned successfully", classRoom });
    } catch (error) {
      console.error("Assign teacher error:", error);
      res.status(500).json({ error: "Failed to assign teacher" });
    }
  }
}
