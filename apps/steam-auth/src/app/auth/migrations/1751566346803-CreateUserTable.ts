import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUserTable1751566346803 implements MigrationInterface {
    name = 'CreateUserTable1751566346803'

 public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
          new Table({
            name: 'user',
            columns: [
              {
                name: 'id',
                type: 'int',
                isPrimary: true,
                isGenerated: true,
                generationStrategy: 'increment',
              },
              {
                name: 'username',
                type: 'varchar',
                isNullable: false,
              },
              {
                name: 'password',
                type: 'varchar',
                isNullable: false,
              },
              {
                name: 'steamGuardCode',
                type: 'varchar',
                isNullable: true,
              },
              {
                name: 'createdAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
              },
              {
                name: 'updatedAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
                onUpdate: 'CURRENT_TIMESTAMP',
              },
            ],
          }),
        );
      }
    
      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('user');
      }
}
