import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHubTable1751615084915 implements MigrationInterface {
    name = 'CreateHubTable1751615084915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hub" ("id" SERIAL NOT NULL, "faceitId" character varying NOT NULL, "hubImage" character varying NOT NULL, "hubName" character varying NOT NULL, "amountUsers" integer NOT NULL, "refferalCodes" text array, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3e44a0e97127ddd25d60430b924" PRIMARY KEY ("id"))`);
        await queryRunner.query(`
            INSERT INTO "hub"
            ("faceitId", "hubImage", "hubName", "amountUsers", "refferalCodes", "createdAt", "updatedAt")
            VALUES 
            ('f8a355b2-7c85-4c21-8eb1-d9307ca02640', 'https://distribution.faceit-cdn.net/images/d74a099f-4c05-47e3-9e3f-be8c9f96cee2.jpeg', 'NAVI Club by whitemarket', 82400, ARRAY['RjAKJXB'], now(), now())
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "hub"`);
    }

}
