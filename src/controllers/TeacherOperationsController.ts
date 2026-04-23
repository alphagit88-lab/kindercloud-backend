import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { TeacherAttendance } from "../entities/TeacherAttendance";
import { TeacherSalary } from "../entities/TeacherSalary";
import { Teacher } from "../entities/Teacher";

export class TeacherOperationsController {
  
  // --- ATTENDANCE ---

  static async markAttendance(req: Request, res: Response) {
    try {
      const { teacherId, status, note } = req.body;
      const today = new Date().toISOString().split('T')[0];

      if (!teacherId || !status) {
        return res.status(400).json({ error: "teacherId and status are required" });
      }

      const repo = AppDataSource.getRepository(TeacherAttendance);
      
      // Check if already marked for today
      let attendance = await repo.findOne({ 
        where: { teacherId: teacherId as string, date: today as any } 
      });

      if (attendance) {
        attendance.status = status;
        if (note) attendance.note = note;
      } else {
        attendance = repo.create({
          teacherId,
          date: today as any,
          status,
          note
        });
      }

      await repo.save(attendance);
      res.json({ message: "Attendance marked successfully", attendance });
    } catch (error) {
      console.error("Mark attendance error:", error);
      res.status(500).json({ error: "Failed to mark attendance" });
    }
  }

  static async getAttendance(req: Request, res: Response) {
    try {
      const { teacherId } = req.params;
      const repo = AppDataSource.getRepository(TeacherAttendance);
      const records = await repo.find({
        where: { teacherId: teacherId as string },
        order: { date: "DESC" },
        take: 30
      });
      res.json(records);
    } catch (error) {
      console.error("Get attendance error:", error);
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  }

  // --- SALARY ---

  static async processSalary(req: Request, res: Response) {
    try {
      const { teacherId, amount, month, year, status, paymentMethod } = req.body;

      if (!teacherId || !amount || !month || !year) {
        return res.status(400).json({ error: "teacherId, amount, month and year are required" });
      }

      const repo = AppDataSource.getRepository(TeacherSalary);
      const salary = repo.create({
        teacherId,
        amount,
        month,
        year,
        status: status || "pending",
        paymentMethod: paymentMethod || "bank_transfer"
      });

      await repo.save(salary);
      res.status(201).json({ message: "Salary processed successfully", salary });
    } catch (error) {
      console.error("Process salary error:", error);
      res.status(500).json({ error: "Failed to process salary" });
    }
  }

  static async getSalaryHistory(req: Request, res: Response) {
    try {
      const { teacherId } = req.params;
      const repo = AppDataSource.getRepository(TeacherSalary);
      const history = await repo.find({
        where: { teacherId: teacherId as string },
        order: { year: "DESC", month: "DESC" }
      });
      res.json(history);
    } catch (error) {
      console.error("Get salary history error:", error);
      res.status(500).json({ error: "Failed to fetch salary history" });
    }
  }
}
