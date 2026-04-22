import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Teacher } from "../entities/Teacher";
import bcrypt from "bcryptjs";

export class TeacherController {
  static async getAll(req: Request, res: Response) {
    try {
      const teacherRepo = AppDataSource.getRepository(Teacher);
      const teachers = await teacherRepo.find({
        relations: ["user"],
        order: { createdAt: "DESC" }
      });
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  }

  static async create(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { 
        firstName, lastName, email, password, phone,
        qualification, specialization, baseSalary 
      } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "First name, last name, email and password are required" });
      }

      const userRepo = queryRunner.manager.getRepository(User);
      const existingUser = await userRepo.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = userRepo.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        role: "teacher",
        status: "active"
      });

      const savedUser = await queryRunner.manager.save(user);

      const teacherRepo = queryRunner.manager.getRepository(Teacher);
      const teacher = teacherRepo.create({
        userId: savedUser.id,
        qualification,
        specialization,
        baseSalary: baseSalary || 0
      });

      await queryRunner.manager.save(teacher);

      await queryRunner.commitTransaction();
      res.status(201).json({ message: "Teacher created successfully", teacherId: teacher.id });

    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error("Error creating teacher:", error);
      res.status(500).json({ error: "Failed to create teacher", details: error.message });
    } finally {
      await queryRunner.release();
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: id as string } });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await userRepo.remove(user); // Cascades to teacher profile
      res.json({ message: "Teacher deleted successfully" });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      res.status(500).json({ error: "Failed to delete teacher" });
    }
  }
}
