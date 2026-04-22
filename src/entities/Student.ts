import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne
} from "typeorm";
import { User } from "./User";
import { ClassRoom } from "./ClassRoom";

@Entity("students")
export class Student {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @OneToOne(() => User, { cascade: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "date", nullable: true })
  dateOfBirth?: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  gender?: string;

  @Column({ name: "admission_date", type: "date", default: () => "CURRENT_DATE" })
  admissionDate!: string;

  @Column({ name: "class_room_id", type: "uuid", nullable: true })
  classRoomId?: string;

  @ManyToOne(() => ClassRoom)
  @JoinColumn({ name: "class_room_id" })
  classRoom?: ClassRoom;

  @Column({ type: "text", nullable: true })
  medicalNotes?: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column({ name: "emergency_contact", length: 100, nullable: true })
  emergencyContact?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
