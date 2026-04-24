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
      let query: any = { relations: ["teacher"] };

      // If teacher is requesting, only show their own classrooms
      if (req.session.userRole === 'teacher') {
        query.where = { teacherId: req.session.userId };
      }

      const classrooms = await repo.find(query);
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
   * Update a ClassRoom (Admin only)
   */
  static async updateClassRoom(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, teacherId } = req.body;

      const repo = AppDataSource.getRepository(ClassRoom);
      const classRoom = await repo.findOne({ where: { id: id as string } });

      if (!classRoom) {
        return res.status(404).json({ error: "ClassRoom not found" });
      }

      if (name) classRoom.name = name;
      if (teacherId !== undefined) classRoom.teacherId = teacherId;

      await repo.save(classRoom);
      res.json({ message: "ClassRoom updated successfully", classRoom });
    } catch (error) {
      console.error("Update classroom error:", error);
      res.status(500).json({ error: "Failed to update classroom" });
    }
  }

  /**
   * Delete a ClassRoom (Admin only)
   */
  static async deleteClassRoom(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`[ClassRoomController] DELETE request received for ID: "${id}"`);
      
      const repo = AppDataSource.getRepository(ClassRoom);
      
      // Detailed logging of available classrooms to debug ID mismatch
      const allClassrooms = await repo.find();
      console.log(`[ClassRoomController] Current classrooms in DB: ${allClassrooms.map(c => c.id).join(', ')}`);
      
      // Check if classroom exists first to provide better 404
      const classRoom = await repo.findOne({ where: { id: id as string } });
      
      if (!classRoom) {
        console.warn(`[ClassRoomController] Classroom with ID "${id}" NOT FOUND in DB.`);
        return res.status(404).json({ 
          error: "ClassRoom not found",
          message: `No classroom exists with the ID: ${id}. Available IDs: ${allClassrooms.map(c => c.id).join(', ')}`
        });
      }

      // Manual cleanup of junction table because TypeORM/DB constraints are failing to cascade
      console.log(`[ClassRoomController] Manually cleaning up student_classrooms links for classroom: ${id}`);
      await AppDataSource.query(`
        DELETE FROM student_classrooms WHERE classroom_id = $1
      `, [id]);

      await repo.remove(classRoom);
      console.log(`[ClassRoomController] Classroom "${id}" deleted successfully`);
      
      res.json({ message: "ClassRoom deleted successfully" });
    } catch (error: any) {
      console.error("Delete classroom error:", error);
      
      // Handle foreign key constraint errors (PostgreSQL code 23503)
      if (error.code === '23503') {
        return res.status(400).json({ 
          error: "Constraint violation", 
          message: "Cannot delete classroom because it has assigned students or lessons. Please reassign or remove them first." 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to delete classroom",
        message: error.message || "An unexpected error occurred",
        code: error.code,
        detail: error.detail
      });
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
