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

@Entity("guardian_links")
export class GuardianLink {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "parent_id", type: "uuid" })
  parentId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "parent_id" })
  parent!: User;

  @Column({ name: "kid_id", type: "uuid" })
  kidId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "kid_id" })
  kid!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
