import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Event } from "../entities/Event";

export class EventController {
  /**
   * Get all events
   */
  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Event);
      const events = await repo.find({
        order: { eventDate: "DESC" }
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  }

  /**
   * Create a new event
   */
  static async create(req: Request, res: Response) {
    try {
      const { title, description, eventDate, audience } = req.body;
      
      if (!title || !eventDate) {
        return res.status(400).json({ error: "Title and event date are required" });
      }

      const repo = AppDataSource.getRepository(Event);
      const event = repo.create({
        title,
        description,
        eventDate,
        audience: audience || "all"
      });

      await repo.save(event);
      res.status(201).json({ message: "Event created successfully", event });
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  }

  /**
   * Delete an event
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const repo = AppDataSource.getRepository(Event);
      const event = await repo.findOne({ where: { id: id as string } });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      await repo.remove(event);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  }
}
