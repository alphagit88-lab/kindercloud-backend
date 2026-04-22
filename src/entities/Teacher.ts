import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn
} from "typeorm";
import { User } from "./User";

@Entity("teachers")
export class Teacher {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @OneToOne(() => User, { cascade: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "qualification", type: "text", nullable: true })
  qualification?: string;

  @Column({ name: "joining_date", type: "date", default: () => "CURRENT_DATE" })
  joiningDate!: string;

  @Column({ name: "specialization", length: 100, nullable: true })
  specialization?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  baseSalary!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
