import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";

@Entity("assets")
export class Asset {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "item_name", length: 255 })
  itemName!: string;

  @Column({
    type: "varchar",
    length: 50,
    enum: ["good", "fair", "damaged", "lost"],
    default: "good"
  })
  condition!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
