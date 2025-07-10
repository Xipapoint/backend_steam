import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
@Entity()
export class RefferalLink {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    code: string

    @Column()
    owner: string

    @Column()
    hubFaceitId: string

    @Column({default: false})
    isDefault: boolean

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}