import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class WarehouseAccount {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    steamId: string

    @Column({ unique: true })
    tradeUserId: string
    
    @Column({default: true, nullable: false})
    isActive: boolean

    @Column({unique: true, nullable: false})
    refferalCode: string
    
    @CreateDateColumn()
    createdAt: Date
    
    @UpdateDateColumn()
    updatedAt: Date
}