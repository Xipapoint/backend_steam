import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWarehouseTable1751615000605 implements MigrationInterface {
    name = 'CreateWarehouseTable1751615000605'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "warehouse_account" ("id" SERIAL NOT NULL, "steamId" character varying NOT NULL, "tradeUserId" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "refferalCode" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_53dabd72890efeb461bb8d380c0" UNIQUE ("steamId"), CONSTRAINT "UQ_532afaa72b3f5da8216b1be01f4" UNIQUE ("tradeUserId"), CONSTRAINT "UQ_53baa0871c0f7800cd569234820" UNIQUE ("refferalCode"), CONSTRAINT "PK_a1cf01e801490c89445d4e0bab9" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`
            INSERT INTO "warehouse_account"
            ("steamId", "tradeUserId", "isActive", "refferalCode", "createdAt", "updatedAt")
            VALUES ('76561199032839640', '1072573912', true, 'RjAKJXB', now(), now())
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "refferal_link"`);
    }

}
