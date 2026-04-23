import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { TeacherAttendance } from "../entities/TeacherAttendance";
import { TeacherSalary } from "../entities/TeacherSalary";
import { Teacher } from "../entities/Teacher";

export class TeacherOperationsController {
  
  // --- ATTENDANCE ---

  static async markAttendance(req: Request, res: Response) {
    try {
      const { status, note, date } = req.body;
      let { teacherId } = req.body;

      // If no teacherId provided, assume self-marking (teacher role)
      if (!teacherId && req.session.userRole === 'teacher') {
        teacherId = req.session.userId;
      }

      if (!teacherId || !status) {
        return res.status(400).json({ error: "teacherId and status are required" });
      }

      const today = date || new Date().toISOString().split('T')[0];
      const now = new Date();

      const repo = AppDataSource.getRepository(TeacherAttendance);
      
      // Check if already marked for today
      let attendance = await repo.findOne({ 
        where: { teacherId: teacherId as string, date: today as any } 
      });

      if (attendance) {
        attendance.status = status;
        if (note) attendance.note = note;
        if (status === 'present' && !attendance.checkInTime) {
            attendance.checkInTime = now;
        }
      } else {
        attendance = repo.create({
          teacherId,
          date: today as any,
          status,
          note,
          checkInTime: status === 'present' ? now : undefined
        });
      }

      await repo.save(attendance);
      res.json({ message: "Attendance updated successfully", attendance });
    } catch (error) {
      console.error("Mark attendance error:", error);
      res.status(500).json({ error: "Failed to mark attendance" });
    }
  }

  static async checkOut(req: Request, res: Response) {
    try {
        const teacherId = req.session.userId;
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        const repo = AppDataSource.getRepository(TeacherAttendance);
        let attendance = await repo.findOne({ 
            where: { teacherId: teacherId as string, date: today as any } 
        });

        if (!attendance) {
            return res.status(404).json({ error: "No attendance record found for today. Please check in first." });
        }

        attendance.checkOutTime = now;
        await repo.save(attendance);
        res.json({ message: "Checked out successfully", attendance });
    } catch (error) {
        console.error("Check out error:", error);
        res.status(500).json({ error: "Failed to check out" });
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
