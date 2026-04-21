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

@Entity("kinder_works")
export class KinderWork {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "kid_id", type: "uuid" })
  kidId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "kid_id" })
  kid!: User;

  @Column({ length: 255 })
  title!: string;

  @Column({
    type: "varchar",
    length: 20,
    enum: ["pdf", "video"],
  })
  fileType!: string;

  @Column({ name: "file_url", type: "text" })
  fileUrl!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
