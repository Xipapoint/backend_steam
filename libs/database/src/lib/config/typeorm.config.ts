import { DataSourceOptions } from 'typeorm';
import path = require('path');
export const getTypeOrmConfig = (baseDir: string): DataSourceOptions => ({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'IstrMart0231/',
  database: 'postgres',
  entities: [path.join(baseDir, '**/entities/*{.ts,.js}')],
  migrations: [path.join(baseDir, '**/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});