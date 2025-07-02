import { ConfigService } from '@nestjs/config';
import path = require('path');
import { DataSourceOptions } from 'typeorm';
export const getTypeOrmConfig = (configService: ConfigService): DataSourceOptions => ({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'IstrMart0231/',
  database: 'postgres',
  entities: [path.join(__dirname, __dirname, __dirname, __dirname, __dirname, 'apps/**/entities/*{.ts,.js}')],
  migrations: [path.join(__dirname, __dirname, __dirname, __dirname, __dirname, 'apps/**/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});