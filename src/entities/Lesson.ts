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
import { ClassRoom } from "./ClassRoom";

@Entity("lessons")
export class Lesson {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "classroom_id", type: "uuid" })
  classRoomId!: string;

  @ManyToOne(() => ClassRoom, { onDelete: "CASCADE" })
  @JoinColumn({ name: "classroom_id" })
  classRoom!: ClassRoom;

  @Column({ name: "teacher_id", type: "uuid" })
  teacherId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "teacher_id" })
  teacher!: User;

  @Column({ length: 255 })
  subject!: string;

  @Column({ name: "lesson_date", type: "date" })
  lessonDate!: Date;

  @Column({ type: "text", nullable: true })
  plan?: string;

  @Column({ type: "text", nullable: true })
  activity?: string;

  @Column({ type: "text", nullable: true })
  progress?: string;

  @Column({ type: "text", nullable: true })
  homework?: string;

  @Column({ type: "text", nullable: true })
  assessment?: string;

  @Column({ name: "attachment_url", type: "text", nullable: true })
  attachmentUrl?: string;

  @Column({ name: "attachment_type", type: "varchar", length: 50, nullable: true })
  attachmentType?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
