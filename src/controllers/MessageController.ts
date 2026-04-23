import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { In } from "typeorm";

export class MessageController {
  
  static async sendMessage(req: Request, res: Response) {
    try {
      const { receiverId, content } = req.body;
      const senderId = req.session.userId;

      if (!receiverId || !content) {
        return res.status(400).json({ error: "receiverId and content are required" });
      }

      if (!senderId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const repo = AppDataSource.getRepository(Message);
      const message = repo.create({
        senderId,
        receiverId,
        content
      });

      await repo.save(message);
      res.status(201).json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  }

  static async getConversation(req: Request, res: Response) {
    try {
      const { otherUserId } = req.params;
      const currentUserId = req.session.userId;

      if (!currentUserId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const repo = AppDataSource.getRepository(Message);
      const messages = await repo.find({
        where: [
          { senderId: currentUserId, receiverId: otherUserId as string },
          { senderId: otherUserId as string, receiverId: currentUserId }
        ],
        order: { createdAt: "ASC" },
        relations: ["sender", "receiver"]
      });

      res.json(messages);
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  }

  static async getConversations(req: Request, res: Response) {
    try {
      const currentUserId = req.session.userId;

      if (!currentUserId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const repo = AppDataSource.getRepository(Message);
      
      // This is a simplified way to get unique users we've chatted with
      const sent = await repo.find({ where: { senderId: currentUserId }, select: ["receiverId"] });
      const received = await repo.find({ where: { receiverId: currentUserId }, select: ["senderId"] });
      
      const userIds = new Set([
        ...sent.map(m => m.receiverId),
        ...received.map(m => m.senderId)
      ]);

      if (userIds.size === 0) {
        return res.json([]);
      }

      const userRepo = AppDataSource.getRepository(User);
      const users = await userRepo.find({
        where: { id: In(Array.from(userIds)) },
        select: ["id", "firstName", "lastName", "role", "profilePicture"]
      });

      res.json(users);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  }

  /**
   * Get potential recipients for a teacher (Admins, Parents, Students)
   */
  static async getRecipients(req: Request, res: Response) {
    try {
      const { role } = req.query; // admin, parent, student (mapped to kid)
      
      let targetRole = role as string;
      if (targetRole === "student") targetRole = "kid";

      const userRepo = AppDataSource.getRepository(User);
      const users = await userRepo.find({
        where: { 
          role: targetRole || In(["admin", "parent", "kid"]),
          isActive: true
        },
        select: ["id", "firstName", "lastName", "role", "profilePicture"],
        order: { firstName: "ASC" }
      });

      res.json(users);
    } catch (error) {
      console.error("Get recipients error:", error);
      res.status(500).json({ error: "Failed to fetch recipients" });
    }
  }
}
