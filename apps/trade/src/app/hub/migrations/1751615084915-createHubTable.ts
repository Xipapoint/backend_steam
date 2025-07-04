import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHubTable1751615084915 implements MigrationInterface {
    name = 'CreateHubTable1751615084915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hub" ("id" SERIAL NOT NULL, "faceitId" character varying NOT NULL, "hubImage" character varying NOT NULL, "hubName" character varying NOT NULL, "amountUsers" integer NOT NULL, "refferalCodes" text array, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3e44a0e97127ddd25d60430b924" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "hub"`);
    }

}
