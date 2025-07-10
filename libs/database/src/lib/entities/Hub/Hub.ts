import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Hub {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    faceitId: string

    @Column()
    hubImage: string

    @Column()
    hubName: string

    @Column()
    amountUsers: number

    @Column("text", { array: true, nullable: true })
    refferalCodes: string[] | null;

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}