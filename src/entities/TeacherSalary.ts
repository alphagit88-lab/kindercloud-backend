import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Teacher } from "./Teacher";

@Entity("teacher_salaries")
export class TeacherSalary {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "teacher_id", type: "uuid" })
  teacherId!: string;

  @ManyToOne(() => Teacher, { onDelete: "CASCADE" })
  @JoinColumn({ name: "teacher_id" })
  teacher!: Teacher;

  @Column({ length: 50 })
  month!: string;

  @Column({ type: "int" })
  year!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: "varchar",
    length: 50,
    enum: ["pending", "paid"],
    default: "pending"
  })
  status!: string;

  @Column({
    type: "varchar",
    length: 50,
    name: "payment_method",
    default: "bank_transfer"
  })
  paymentMethod!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
