import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";

@Entity("stocks")
export class Stock {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "item_name", length: 255 })
  itemName!: string;

  @Column({ type: "int" })
  quantity!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
