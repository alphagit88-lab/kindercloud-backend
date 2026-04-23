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

@Entity("teacher_attendances")
export class TeacherAttendance {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "teacher_id", type: "uuid" })
  teacherId!: string;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: "teacher_id" })
  teacher!: Teacher;

  @Column({ type: "date" })
  date!: Date;

  @Column({
    type: "varchar",
    length: 50,
    enum: ["present", "absent", "late", "leave", "half-day"],
    default: "present"
  })
  status!: string;

  @Column({ name: "check_in_time", type: "timestamp", nullable: true })
  checkInTime?: Date;

  @Column({ name: "check_out_time", type: "timestamp", nullable: true })
  checkOutTime?: Date;

  @Column({ type: "text", nullable: true })
  note?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
