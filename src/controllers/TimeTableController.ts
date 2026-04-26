import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { TimeTable } from "../entities/TimeTable";

export class TimeTableController {
  
  static async getByClass(req: Request, res: Response) {
    try {
      const { classRoomId } = req.params;
      const repo = AppDataSource.getRepository(TimeTable);
      const schedule = await repo.find({
        where: { classRoomId: classRoomId as string },
        order: { startTime: "ASC" }
      });
      res.json(schedule);
    } catch (error) {
      console.error("Get timetable error:", error);
      res.status(500).json({ error: "Failed to fetch timetable" });
    }
  }

  static async addEntry(req: Request, res: Response) {
    try {
      const { classRoomId, teacherId, dayOfWeek, startTime, endTime, activity, location } = req.body;
      
      if (!classRoomId || !dayOfWeek || !startTime || !endTime || !activity) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const repo = AppDataSource.getRepository(TimeTable);
      const entry = repo.create({
        classRoomId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        activity,
        location
      });

      await repo.save(entry);
      res.status(201).json({ message: "Timetable entry added", entry });
    } catch (error) {
      console.error("Add timetable entry error:", error);
      res.status(500).json({ error: "Failed to add timetable entry" });
    }
  }

  static async deleteEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const repo = AppDataSource.getRepository(TimeTable);
      const entry = await repo.findOne({ where: { id: id as string } });

      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      await repo.remove(entry);
      res.json({ message: "Entry deleted successfully" });
    } catch (error) {
      console.error("Delete timetable entry error:", error);
      res.status(500).json({ error: "Failed to delete entry" });
    }
  }

  static async updateEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { dayOfWeek, startTime, endTime, activity, location, teacherId } = req.body;
      
      const repo = AppDataSource.getRepository(TimeTable);
      const entry = await repo.findOne({ where: { id: id as string } });

      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      if (dayOfWeek) entry.dayOfWeek = dayOfWeek;
      if (startTime) entry.startTime = startTime;
      if (endTime) entry.endTime = endTime;
      if (activity) entry.activity = activity;
      if (location !== undefined) entry.location = location;
      if (teacherId !== undefined) entry.teacherId = teacherId;

      await repo.save(entry);
      res.json({ message: "Timetable entry updated", entry });
    } catch (error) {
      console.error("Update timetable entry error:", error);
      res.status(500).json({ error: "Failed to update entry" });
    }
  }
}
