import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Student } from "../entities/Student";
import { GuardianLink } from "../entities/GuardianLink";
import bcrypt from "bcryptjs";

export class StudentController {
  /**
   * Get all students
   */
  static async getAll(req: Request, res: Response) {
    try {
      const studentRepo = AppDataSource.getRepository(Student);
      const students = await studentRepo.find({
        relations: ["user", "classRoom"],
        order: { createdAt: "DESC" }
      });

      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  }

  /**
   * Create student and optionally a guardian
   */
  static async create(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { 
        firstName, lastName, email, password, gender, dateOfBirth, 
        medicalNotes, classRoomId, address, emergencyContact,
        guardianInfo // { firstName, lastName, email, phone, relationship }
      } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "Student name, email and password are required" });
      }

      // 1. Create Student User
      const userRepo = queryRunner.manager.getRepository(User);
      const existingUser = await userRepo.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: "Student email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const studentUser = userRepo.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "kid",
        status: "active"
      });

      const savedStudentUser = await queryRunner.manager.save(studentUser);

      // 2. Create Student Profile
      const studentRepo = queryRunner.manager.getRepository(Student);
      const studentProfile = studentRepo.create({
        userId: savedStudentUser.id,
        gender,
        dateOfBirth,
        medicalNotes,
        classRoomId,
        address,
        emergencyContact
      });

      await queryRunner.manager.save(studentProfile);

      // 3. Create Guardian if info provided
      if (guardianInfo && guardianInfo.email) {
        let guardianUser = await userRepo.findOne({ where: { email: guardianInfo.email } });
        
        if (!guardianUser) {
          const guardianPassword = await bcrypt.hash("Kinder@Guardian!", 10);
          guardianUser = userRepo.create({
            firstName: guardianInfo.firstName,
            lastName: guardianInfo.lastName,
            email: guardianInfo.email,
            password: guardianPassword,
            phone: guardianInfo.phone,
            role: "parent",
            status: "active"
          });
          guardianUser = await queryRunner.manager.save(guardianUser);
        }

        // Link Guardian to Kid
        const linkRepo = queryRunner.manager.getRepository(GuardianLink);
        const link = linkRepo.create({
          parentId: guardianUser.id,
          kidId: savedStudentUser.id
        });
        await queryRunner.manager.save(link);
      }

      await queryRunner.commitTransaction();
      res.status(201).json({ message: "Student and Guardian created successfully", studentId: savedStudentUser.id });

    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error("Error creating student:", error);
      res.status(500).json({ error: "Failed to create student", details: error.message });
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update student
   */
  static async update(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { id } = req.params; // userId
      const { 
        firstName, lastName, email, gender, dateOfBirth, 
        medicalNotes, classRoomId, address, emergencyContact 
      } = req.body;

      const userRepo = queryRunner.manager.getRepository(User);
      const studentRepo = queryRunner.manager.getRepository(Student);

      const user = await userRepo.findOne({ where: { id: id as string } });
      if (!user) {
        return res.status(404).json({ error: "Student not found" });
      }

      const student = await studentRepo.findOne({ where: { userId: id as string } });
      if (!student) {
        return res.status(404).json({ error: "Student profile not found" });
      }

      // Update User
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (email) user.email = email;
      await queryRunner.manager.save(user);

      // Update Student Profile
      if (gender) student.gender = gender;
      if (dateOfBirth) student.dateOfBirth = dateOfBirth;
      if (medicalNotes !== undefined) student.medicalNotes = medicalNotes;
      if (classRoomId !== undefined) student.classRoomId = classRoomId;
      if (address) student.address = address;
      if (emergencyContact) student.emergencyContact = emergencyContact;
      await queryRunner.manager.save(student);

      await queryRunner.commitTransaction();
      res.json({ message: "Student updated successfully" });
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error("Error updating student:", error);
      res.status(500).json({ error: "Failed to update student", details: error.message });
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete student
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: id as string } });
      
      if (!user) {
        return res.status(404).json({ error: "Student not found" });
      }

      await userRepo.remove(user); // Will cascade delete student profile
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  }
}
