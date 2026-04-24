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

@Entity("diaries")
export class Diary {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "teacher_id", type: "uuid" })
  teacherId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "teacher_id" })
  teacher!: User;

  @Column({
    type: "varchar",
    length: 20,
    enum: ["year", "month", "day"],
  })
  type!: string;

  @Column({ type: "text" })
  planDetails!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
