import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Proxy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
  })
  ip: number;

  @Column({
    type: 'int',
  })
  port: number;

  @Column({
    type: 'boolean',
    default: true
  })
  isActive: boolean
}