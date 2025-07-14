import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProxyTable1752496152491 implements MigrationInterface {
    name = 'CreateProxyTable1752496152491'

public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "proxy" (
                "id" SERIAL NOT NULL,
                "ip" character varying NOT NULL,
                "port" integer NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "cooldown" TIMESTAMP,
                "isUsing" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_581edf779fc90b8d2687c658276" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            INSERT INTO "proxy" ("ip", "port") VALUES
            ('185.241.150.122', 50100),
            ('82.211.9.203', 50100),
            ('213.209.130.168', 50100),
            ('77.90.178.45', 50100),
            ('31.59.238.77', 50100)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "proxy"`);
    }

}
