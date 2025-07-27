import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefferalLinkTable1751615067694 implements MigrationInterface {
    name = 'CreateRefferalLinkTable1751615067694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refferal_link" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "owner" character varying NOT NULL, "hubFaceitId" character varying NOT NULL, "isDefault" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ea801c34c304fe7c9c5e1317c3e" UNIQUE ("code"), CONSTRAINT "PK_f1967f7de1ed44977807ff6af24" PRIMARY KEY ("id"))`); 
        
        await queryRunner.query(`
            INSERT INTO "refferal_link" 
            ("code", "owner", "hubFaceitId", "isDefault")
            VALUES 
            ('RjAKJXB', 'insane123', 'f8a355b2-7c85-4c21-8eb1-d9307ca02640', true)
        `);
    
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "refferal_link"`);
    }

}
