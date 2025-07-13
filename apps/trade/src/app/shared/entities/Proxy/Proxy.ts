import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Proxy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
  })
  ip: string;

  @Column({
    type: 'int',
  })
  port: number;

  @Column({
    type: 'boolean',
    default: true
  })
  isActive: boolean

  @Column({
    type: "timestamp",
    nullable: true,
    default: null,
  })
  cooldown: Date | null
  
  @Column({
    type: 'boolean',
    default: false
  })
  isUsing: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}