import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from "typeorm";
import { User } from "./User";

@Entity("class_rooms")
export class ClassRoom {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: "teacher_id", type: "uuid", nullable: true })
  teacherId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "teacher_id" })
  teacher!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
