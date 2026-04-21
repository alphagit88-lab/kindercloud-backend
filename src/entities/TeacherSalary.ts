import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { User } from "./User";

@Entity("teacher_salaries")
export class TeacherSalary {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "teacher_id", type: "uuid" })
  teacherId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "teacher_id" })
  teacher!: User;

  @Column({ length: 50 })
  month!: string; // e.g. '2026-04'

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: "varchar",
    length: 50,
    enum: ["pending", "paid"],
    default: "pending"
  })
  status!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
