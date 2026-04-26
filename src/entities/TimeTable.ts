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

@Entity("time_tables")
export class TimeTable {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "classroom_id", type: "uuid" })
  classRoomId!: string;

  @ManyToOne(() => ClassRoom, { onDelete: "CASCADE" })
  @JoinColumn({ name: "classroom_id" })
  classRoom!: ClassRoom;

  @Column({ name: "teacher_id", type: "uuid", nullable: true })
  teacherId?: string;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "teacher_id" })
  teacher?: User;

  @Column({ length: 50 })
  dayOfWeek!: string;

  @Column({ type: "time" })
  startTime!: string;

  @Column({ type: "time" })
  endTime!: string;

  @Column({ type: "varchar", length: 100 })
  activity!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  location?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
